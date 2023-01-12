import * as rand from './rand';
import * as postprocessing from './postprocessing';
import { defaultBMLSettings, defaultRenderSettings, mergeSettings, RenderSettings } from './settings';
import { Reference } from './reference';
import { parseDocument } from './parsers';
import { UserDefs } from './userDefs';
import { AstNode } from './ast';
import { Lexer } from './lexer';
import { Replacer } from './replacer';
import { Choice } from './weightedChoice';
import { isStr } from './stringUtils';
import { EvalBindingError } from './errors';


export type ChoiceResult = { choiceIndex: number, renderedOutput: string };
export type ChoiceResultMap = Map<string, ChoiceResult>;

/**
 * A helper class for rendering an AST.
 *
 * This is meant to be used only once per render.
 */
class Renderer {

  choiceResultMap: ChoiceResultMap;
  evalBindings: UserDefs;

  constructor() {
    this.choiceResultMap = new Map();
    this.evalBindings = {};
  }

  resolveReference(reference: Reference): Choice {
    let referredChoiceResult = this.choiceResultMap.get(reference.referredIdentifier);
    if (referredChoiceResult) {
      if (!reference.choiceMap.size && !reference.fallbackReplacer) {
        // this is a special "copy" backref
        return [referredChoiceResult.renderedOutput];
      }
      let matchedReferenceResult = reference.choiceMap.get(referredChoiceResult.choiceIndex);
      if (matchedReferenceResult !== undefined) {
        return matchedReferenceResult;
      }
    }
    if (!reference.fallbackReplacer) {
      console.warn(`No matching reference or fallback found for ${reference.referredIdentifier}`);
      return [''];
    }
    return reference.fallbackReplacer.call().replacement;
  }

  renderChoice(choice: Choice): string {
    if (choice instanceof Array) {
      return this.renderAst(choice);
    } else {
      let evalResult = choice.execute(this.evalBindings);
      for (let [key, value] of Object.entries(evalResult.bindings)) {
        if (this.evalBindings.hasOwnProperty(key)) {
          throw new EvalBindingError(key);
        }
        this.evalBindings[key] = value;
      }
      return evalResult.output;
    }
  }

  renderAst(ast: AstNode[]): string {
    let output = '';
    for (let i = 0; i < ast.length; i++) {
      let node = ast[i];
      if (isStr(node)) {
        output += node;
      } else if (node instanceof Replacer) {
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
          this.choiceResultMap.set(node.identifier, { choiceIndex, renderedOutput })
        }
      } else {
        let backRefResult = this.resolveReference(node);
        output += this.renderChoice(backRefResult);
      }
    }
    return output;
  }

  postprocess(text: string): string {
    let documentSettings = mergeSettings(defaultBMLSettings, this.evalBindings.settings);
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
    return output;
  }

  renderAndPostProcess(ast: AstNode[]): string {
    let renderedText = this.renderAst(ast);
    return this.postprocess(renderedText);
  }
}


export function render(bmlDocumentString: string, renderSettings?: RenderSettings): string {
  renderSettings = mergeSettings(defaultRenderSettings, renderSettings);
  if (renderSettings.randomSeed) {
    rand.setRandomSeed(renderSettings.randomSeed);
  }

  let lexer = new Lexer(bmlDocumentString);
  let ast = parseDocument(lexer, true);
  return new Renderer().renderAndPostProcess(ast);
}
