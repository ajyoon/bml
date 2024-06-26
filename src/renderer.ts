import path from 'path';
import process from 'process';
import fs from 'fs';
import * as rand from './rand';
import * as postprocessing from './postprocessing';
import { defaultBMLSettings, defaultRenderSettings, mergeSettings, RenderSettings } from './settings';
import { Reference } from './reference';
import { parseDocument } from './parsers';
import { AstNode } from './ast';
import { Lexer } from './lexer';
import { ChoiceFork } from './choiceFork';
import { Choice } from './weightedChoice';
import { isStr } from './stringUtils';
import { EvalDisabledError, IncludeError } from './errors';
import { EvalContext } from './evalBlock';


// If the referred fork is a silent set fork that has not yet been executed,
// choiceIndex will be -1 and renderedOutput will be ''.
export type ExecutedFork = { choiceFork: ChoiceFork, choiceIndex: number, renderedOutput: string }
export type ExecutedForkMap = Map<string, ExecutedFork>

/**
 * A helper class for rendering an AST.
 *
 * This is meant to be used only once per render.
 */
export class Renderer {

  settings: RenderSettings;
  executedForkMap: ExecutedForkMap;
  evalContext: EvalContext;

  constructor(settings: RenderSettings) {
    this.settings = settings;
    this.executedForkMap = new Map();
    this.evalContext = { bindings: {}, output: '', renderer: this };
  }

  resolveReference(reference: Reference): string {
    let referredExecutedFork = this.executedForkMap.get(reference.id);
    if (referredExecutedFork) {
      if (reference.reExecute) {
        // this is a special "re-execute" reference
        let { replacement, choiceIndex } = referredExecutedFork.choiceFork.call();
        let renderedOutput = this.renderChoice(replacement);
        referredExecutedFork.choiceIndex = choiceIndex;
        referredExecutedFork.renderedOutput = renderedOutput;
        return renderedOutput;
      }
      if (!reference.referenceMap.size && !reference.fallbackChoiceFork) {
        // this is a special "copy" reference
        return this.renderChoice([referredExecutedFork.renderedOutput]);
      }
      let matchedReferenceResult = reference.referenceMap.get(referredExecutedFork.choiceIndex);
      if (matchedReferenceResult !== undefined) {
        return this.renderChoice(matchedReferenceResult);
      }
    }
    if (!reference.fallbackChoiceFork) {
      console.warn(`No matching reference or fallback found for ${reference.id}`);
      return this.renderChoice(['']);
    }
    return this.renderChoice(reference.fallbackChoiceFork.call().replacement);
  }

  renderChoice(choice: Choice): string {
    if (choice instanceof Array) {
      return this.renderAst(choice);
    } else {
      if (!this.settings.allowEval) {
        throw new EvalDisabledError();
      }
      choice.execute(this.evalContext);
      let output = this.evalContext.output;
      this.evalContext.output = '';
      return output;
    }
  }

  renderAst(ast: AstNode[]): string {
    let output = '';
    for (let i = 0; i < ast.length; i++) {
      let node = ast[i];
      if (isStr(node)) {
        output += node;
      } else if (node instanceof ChoiceFork) {
        if (node.isSet && node.isSilent) {
          // Silent set declarations are *not* immediately executed.
          this.executedForkMap.set(node.identifier!,
            { choiceFork: node, choiceIndex: -1, renderedOutput: '' });
          continue;
        }
        let { replacement, choiceIndex } = node.call();
        let renderedOutput = this.renderChoice(replacement);
        if (node.isSilent) {
          if (output.length && output[output.length - 1] == '\n') {
            // This silent fork started a new line.
            // If the next character is also a newline, skip it.
            let nextNode = i < ast.length - 1 ? (ast[i + 1]) : null;
            if (isStr(nextNode)) {
              if (nextNode.startsWith('\n')) {
                ast[i + 1] = nextNode.slice(1);
              } else if (nextNode.startsWith('\r\n')) {
                ast[i + 1] = nextNode.slice(2);
              }
            }
          }
        } else {
          output += renderedOutput;
        }
        if (node.identifier) {
          this.executedForkMap.set(node.identifier,
            { choiceFork: node, choiceIndex, renderedOutput })
        }
      } else {
        output += this.resolveReference(node)
      }
    }
    return output;
  }

  postprocess(text: string): string {
    let documentSettings = mergeSettings(
      defaultBMLSettings, this.evalContext.bindings.settings);
    let output = text;
    output = postprocessing.replaceVisualLineBreaks(output);
    if (documentSettings.punctuationCleanup) {
      output = postprocessing.punctuationCleanup(output);
    }
    if (documentSettings.capitalizationCleanup) {
      output = postprocessing.capitalizationCleanup(output);
    }
    if (documentSettings.whitespaceCleanup) {
      output = postprocessing.whitespaceCleanup(output);
    }
    if (documentSettings.indefiniteArticleCleanup) {
      output = postprocessing.correctIndefiniteArticles(output);
    }
    return output;
  }

  renderWithoutPostProcess(ast: AstNode[]): string {
    if (this.settings.randomSeed) {
      rand.setRandomSeed(this.settings.randomSeed);
    }
    return this.renderAst(ast);
  }

  renderAndPostProcess(ast: AstNode[]): string {
    return this.postprocess(this.renderWithoutPostProcess(ast));
  }

  /* Load and render a given BML file path,
   * merging its eval context and fork map this renderer's.
   */
  renderInclude(includePath: string): string {
    let rngState = rand.saveRngState();
    let bmlDocumentString;
    let resolvedWorkingDir = this.settings.workingDir || process.cwd();
    let resolvedIncludePath = path.resolve(resolvedWorkingDir, includePath);
    try {
      bmlDocumentString = '' + fs.readFileSync(resolvedIncludePath);
    } catch (e) {
      if (typeof window !== 'undefined') {
        throw new IncludeError(includePath, `Includes can't be used in browsers`);
      }
      if (e instanceof Error && e.message && e.message.includes('no such file or directory')) {
        throw new IncludeError(includePath, `File not found`);
      }
      throw e;
    }

    let lexer = new Lexer(bmlDocumentString);
    let ast = parseDocument(lexer, true);
    let subWorkingDir = path.dirname(resolvedIncludePath)
    let subSettings = {
      ...this.settings,
      workingDir: subWorkingDir,
    }
    let subRenderer = new Renderer(subSettings);
    let result = subRenderer.renderWithoutPostProcess(ast);
    // Merge state from subrenderer into this renderer
    // Any redefined references are silently overwritten; this is needed to support
    // repeated includes (caused by diamond-like include graphs) without using namespacing.
    for (let [key, value] of Object.entries(subRenderer.evalContext.bindings)) {
      this.evalContext.bindings[key] = value;
    }
    for (let [key, value] of subRenderer.executedForkMap) {
      this.executedForkMap.set(key, value);
    }
    rand.restoreRngState(rngState);
    return result;
  }
}

export function render(bmlDocumentString: string,
  renderSettings: RenderSettings | null): string {
  renderSettings = mergeSettings(defaultRenderSettings, renderSettings);
  let lexer = new Lexer(bmlDocumentString);
  let ast = parseDocument(lexer, true);
  return new Renderer(renderSettings).renderAndPostProcess(ast);
}

