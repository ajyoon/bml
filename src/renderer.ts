import path from 'path';
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
import * as fileUtils from './fileUtils';


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
  documentDir: string | null;

  constructor(settings: RenderSettings, documentDir: string | null) {
    this.settings = settings;
    this.executedForkMap = new Map();
    this.evalContext = { bindings: {}, output: '', renderer: this };
    this.documentDir = documentDir;
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
    try {
      bmlDocumentString = fileUtils.readFile(includePath, this.documentDir);
    } catch (e) {
      if (typeof window !== 'undefined') {
        throw new IncludeError(includePath, `Includes can't be used in browsers`);
      }
      throw e;
    }

    let lexer = new Lexer(bmlDocumentString);
    let ast = parseDocument(lexer, true);
    let subRenderer = new Renderer(this.settings, path.dirname(includePath));
    let result = subRenderer.renderWithoutPostProcess(ast);
    // Merge state from subrenderer into this renderer
    for (let [key, value] of Object.entries(subRenderer.evalContext.bindings)) {
      if (this.evalContext.bindings.hasOwnProperty(key)) {
        throw new IncludeError(includePath, `Eval binding '${key}' is already bound`);
      }
      this.evalContext.bindings[key] = value;
    }
    for (let [key, value] of subRenderer.executedForkMap) {
      if (this.executedForkMap.has(key)) {
        throw new IncludeError(includePath, `Fork id '${key}' is already defined`);
      }
      this.executedForkMap.set(key, value);
    }
    rand.restoreRngState(rngState);
    return result;
  }
}

export function render(bmlDocumentString: string,
  renderSettings: RenderSettings | null, documentDir: string | null): string {
  renderSettings = mergeSettings(defaultRenderSettings, renderSettings);
  let lexer = new Lexer(bmlDocumentString);
  let ast = parseDocument(lexer, true);
  return new Renderer(renderSettings, documentDir).renderAndPostProcess(ast);
}

