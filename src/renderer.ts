import * as rand from './rand';
import * as postprocessing from './postprocessing';
import { defaultBMLSettings, defaultRenderSettings, mergeSettings, RenderSettings } from './settings';
import { Mode, ModeMap } from './mode';
import { BackReference } from './backReference';
import { parsePrelude, parseUse, parseInlineCommand, } from './parsers';
import { UserDefs } from './evalBlock';
import { FunctionCall } from './functionCall';
import { Lexer } from './lexer';
import { TokenType } from './tokenType';
import { UnknownModeError, BMLDuplicatedRefError, IllegalStateError, } from './errors';
import { Choice } from './weightedChoice';
const BML_VERSION = require('../package.json')['version'];

export type ChoiceResult = { choiceIndex: number, renderedOutput: string };
export type ChoiceResultMap = Map<string, ChoiceResult>;


/**
 * Check if the running version of bml aligns with a specified one.
 *
 * If the versions do not align, log a warning to the console.
 * If no version is specified, do nothing.
 */
function checkVersion(bmlVersion: string, specifiedInSettings: string) {
  if (specifiedInSettings !== bmlVersion) {
    console.warn('BML VERSION MISMATCH.' +
      ' bml source file specifies version ' + specifiedInSettings +
      ' but running version is ' + BML_VERSION + '.' +
      ' unexpected behavior may occur.');
  }
}

function resolveBackReference(choiceResultMap: ChoiceResultMap, backReference: BackReference): Choice {
  let referredChoiceResult = choiceResultMap.get(backReference.referredIdentifier);
  if (referredChoiceResult) {
    if (backReference.choiceMap.size === 0 && backReference.fallback === null) {
      // this is a special "copy" backref
      return referredChoiceResult.renderedOutput;
    }
    let matchedBackReferenceResult = backReference.choiceMap.get(referredChoiceResult.choiceIndex);
    if (matchedBackReferenceResult !== undefined) {
      return matchedBackReferenceResult;
    }
  }
  if (backReference.fallback === null) {
    console.warn(`No matching reference or fallback found for ${backReference.referredIdentifier}`);
    return '';
  }
  return backReference.fallback;
}

/**
 * The main loop which processes the text component of a bml document.
 *
 * Iterates through the body of the text exactly once, applying rules
 * whenever a matching string is encountered. Rules are processed in
 * the order they are listed in the active mode's declaration.
 */
export function renderText(str: string, startIndex: number, modes: ModeMap,
  activeMode: Mode | null, userDefs: UserDefs,
  choiceResultMap: ChoiceResultMap | null, stackDepth: number
): string {
  // TODO this function is way too complex and badly needs refactor
  choiceResultMap = choiceResultMap || new Map();
  activeMode = activeMode || null;
  let inVisualLineBreak = false;
  let inLiteralBlock = false;
  let out = '';
  let currentRule = null;
  let foundMatch = false;
  let replacement = null;
  let chooseRe = /\s*(\(|call|#?\w+:|@\w+)/y;
  let useRe = /\s*(use|using)/y;
  let token;
  let lexer = new Lexer(str);
  lexer.overrideIndex(startIndex);

  if (stackDepth > 1000) {
    throw new Error(
      'render stack depth exceeded 1000, aborting likely infinite recursion.');
  }

  while ((token = lexer.peek()) !== null) {

    if (inLiteralBlock) {
      if (token.tokenType === TokenType.CLOSE_DOUBLE_BRACKET) {
        inLiteralBlock = false;
      } else {
        out += token.str;
      }
      lexer.next();
      continue;
    }

    if (inVisualLineBreak) {
      if (token.tokenType === TokenType.WHITESPACE) {
        lexer.next();
        continue;
      } else {
        inVisualLineBreak = false;
      }
    }

    switch (token.tokenType) {
      case TokenType.OPEN_DOUBLE_BRACKET:
        inLiteralBlock = true;
        break;
      case TokenType.NEW_LINE:
        if (out.endsWith('\\')) {
          inVisualLineBreak = true;
          // hackily overwrite the backslash to a space since it's for a
          // visual line break.
          out = out.substring(0, out.length - 1) + ' ';
        } else {
          out += token.str;
        }
        break;
      case TokenType.OPEN_BRACE:
        chooseRe.lastIndex = token.index + 1;
        useRe.lastIndex = token.index + 1;
        if (chooseRe.test(str)) {
          let parseInlineCommandResult = parseInlineCommand(str, token.index);
          let replacer = parseInlineCommandResult.replacer;
          let backReference = parseInlineCommandResult.backReference;
          let replacerCallResult;
          if (replacer) {
            replacerCallResult = replacer.call();
            if (replacer.identifier) {
              if (choiceResultMap.has(replacer.identifier)) {
                throw new BMLDuplicatedRefError(replacer.identifier, str, token.index);
              }
            }
            replacement = replacerCallResult.replacement;
          } else {
            // sanity check
            if (!backReference) {
              throw new IllegalStateError('No replacer or backref from inline choose');
            }
            replacement = resolveBackReference(choiceResultMap, backReference);
          }
          let renderedReplacement;
          if (replacement instanceof FunctionCall) {
            renderedReplacement = replacement.execute(userDefs, [], str, token.index);
          } else if (typeof replacement === 'symbol') {
            throw new IllegalStateError('No-op replacers should never come from inline choices');
          } else {
            // To handle nested choices and to run rules over chosen text,
            // we recursively render the chosen text.
            renderedReplacement = renderText(
              replacement, 0, modes, activeMode, userDefs, choiceResultMap, stackDepth + 1);
          }
          if (!(replacer && replacer.isSilent)) {
            out += renderedReplacement;
          }
          if (replacerCallResult && replacer?.identifier) {
            choiceResultMap.set(
              replacer.identifier,
              { choiceIndex: replacerCallResult.choiceIndex, renderedOutput: renderedReplacement });
          }
          lexer.overrideIndex(parseInlineCommandResult.blockEndIndex);
          continue;
        } else if (useRe.test(str)) {
          let parseUseResult = parseUse(str, token.index);
          lexer.overrideIndex(parseUseResult.blockEndIndex);
          if (modes.hasOwnProperty(parseUseResult.modeName)) {
            activeMode = modes[parseUseResult.modeName];
          } else {
            throw new UnknownModeError(parseUseResult.modeName, str, token.index);
          }
        }
        break;
      default:
        if (activeMode !== null) {
          ruleLoop:
          for (let r = 0; r < activeMode.rules.length; r++) {
            currentRule = activeMode.rules[r];
            for (let m = 0; m < currentRule.matchers.length; m++) {
              currentRule.matchers[m].lastIndex = token.index;
              let currentMatch = currentRule.matchers[m].exec(str);
              if (currentMatch !== null) {
                replacement = currentRule.replacer.call().replacement;
                if (replacement instanceof FunctionCall) {
                  out += replacement.execute(userDefs, currentMatch, str, token.index);
                } else if (typeof replacement === 'symbol') { // no-op
                  out += currentMatch[0];
                } else {
                  // To handle nested choices and to run rules over replaced text,
                  // we recursively render the chosen text.
                  let renderedReplacement = renderText(
                    replacement, 0, modes, activeMode, userDefs, choiceResultMap, stackDepth + 1);
                  out += renderedReplacement;
                }
                lexer.overrideIndex(lexer.index + currentMatch[0].length);
                foundMatch = true;
                break ruleLoop;
              }
            }
          }
        }
        if (foundMatch) {
          foundMatch = false;
          continue;
        } else {
          out += token.str;
        }

        break;  // Break from `switch (token.tokenType)`
    }

    lexer.next();  // Consume token
  }

  return out;
}

export function render(bmlDocumentString: string, renderSettings: RenderSettings): string {
  // Resolve render settings
  renderSettings = mergeSettings(defaultRenderSettings, renderSettings);
  if (renderSettings.randomSeed) {
    rand.setRandomSeed(renderSettings.randomSeed);
  }

  // Parse prelude
  let {
    preludeEndIndex,
    evalBlock,
    modes,
  } = parsePrelude(bmlDocumentString);

  let userDefs: UserDefs = { funcs: {} };
  if (evalBlock && renderSettings.allowEval) {
    userDefs = evalBlock.execute();
    if (userDefs.settings?.version) {
      checkVersion(BML_VERSION, userDefs.settings.version);
    }
    userDefs.settings = mergeSettings(defaultBMLSettings, userDefs.settings);
  }

  // Main render pass
  let output = renderText(
    bmlDocumentString, preludeEndIndex, modes, null, userDefs, null, 0);

  // Post-processing
  if (renderSettings.renderMarkdown) {
    output = postprocessing.renderMarkdown(output, userDefs.settings!.markdownSettings!);
  }
  if (renderSettings.whitespaceCleanup) {
    output = postprocessing.whitespaceCleanup(output);
  }

  return output;
}
