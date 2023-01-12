import * as rand from './rand';
import * as postprocessing from './postprocessing';
import { defaultRenderSettings, mergeSettings, RenderSettings } from './settings';
import { BackReference } from './backReference';
import { parseDocument } from './parsers';
import { UserDefs } from './userDefs';
import { AstNode } from './ast';
import { Lexer } from './lexer';
import { Replacer } from './replacer';
import { BMLDuplicatedRefError, IllegalStateError, } from './errors';
import { Choice } from './weightedChoice';
import { isStr } from './stringUtils';


export type ChoiceResult = { choiceIndex: number, renderedOutput: string };
export type ChoiceResultMap = Map<string, ChoiceResult>;

function resolveBackReference(choiceResultMap: ChoiceResultMap, backReference: BackReference): Choice {
  let referredChoiceResult = choiceResultMap.get(backReference.referredIdentifier);
  if (referredChoiceResult) {
    if (backReference.choiceMap.size === 0 && backReference.fallback === null) {
      // this is a special "copy" backref
      return [referredChoiceResult.renderedOutput];
    }
    let matchedBackReferenceResult = backReference.choiceMap.get(referredChoiceResult.choiceIndex);
    if (matchedBackReferenceResult !== undefined) {
      return matchedBackReferenceResult;
    }
  }
  if (backReference.fallback === null) {
    console.warn(`No matching reference or fallback found for ${backReference.referredIdentifier}`);
    return [''];
  }
  return backReference.fallback;
}

function renderChoice(choice: Choice, choiceResultMap: ChoiceResultMap): string {
  if (choice instanceof Array) {
    return renderAst(choice, choiceResultMap);
  } else {
    return choice.execute();
  }
}

function renderAst(ast: AstNode[], choiceResultMap: ChoiceResultMap): string {
  let output = '';
  for (let i = 0; i < ast.length; i++) {
    let node = ast[i];
    if (isStr(node)) {
      output += node;
    } else if (node instanceof Replacer) {
      let { replacement, choiceIndex } = node.call();
      let renderedOutput = renderChoice(replacement, choiceResultMap);
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
        choiceResultMap.set(node.identifier, { choiceIndex, renderedOutput })
      }
    } else {
      let backRefResult = resolveBackReference(choiceResultMap, node);
      output += renderChoice(backRefResult, choiceResultMap);
    }
  }
  return output;
}

function postprocess(text: string): string {
  let output = text;
  output = postprocessing.replaceVisualLineBreaks(output);
  return output;
}

export function render(bmlDocumentString: string, renderSettings?: RenderSettings): string {
  // Resolve render settings
  renderSettings = mergeSettings(defaultRenderSettings, renderSettings);
  if (renderSettings.randomSeed) {
    rand.setRandomSeed(renderSettings.randomSeed);
  }

  let lexer = new Lexer(bmlDocumentString);
  let ast = parseDocument(lexer, true);
  let renderedText = renderAst(ast, new Map());
  return postprocess(renderedText);
}
