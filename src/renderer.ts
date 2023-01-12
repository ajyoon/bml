import * as rand from './rand';
import * as postprocessing from './postprocessing';
import { defaultRenderSettings, mergeSettings, RenderSettings } from './settings';
import { BackReference } from './backReference';
import { parseDocument } from './parsers';
import { UserDefs } from './userDefs';
import { AstNode } from './ast';
import { Lexer } from './lexer';
import { TokenType } from './tokenType';
import { Replacer } from './replacer';
import { UnknownModeError, BMLDuplicatedRefError, IllegalStateError, } from './errors';
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
  for (let node of ast) {
    if (isStr(node)) {
      output += node;
    } else if (node instanceof Replacer) {
      let { replacement, choiceIndex } = node.call();
      let renderedOutput = renderChoice(replacement, choiceResultMap);
      output += renderedOutput;
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

export function render(bmlDocumentString: string, renderSettings?: RenderSettings): string {
  // Resolve render settings
  renderSettings = mergeSettings(defaultRenderSettings, renderSettings);
  if (renderSettings.randomSeed) {
    rand.setRandomSeed(renderSettings.randomSeed);
  }

  let lexer = new Lexer(bmlDocumentString);
  let ast = parseDocument(lexer, true);
  return renderAst(ast, new Map());
}
