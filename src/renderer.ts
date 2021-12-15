const _parsers = require('./parsers.ts');
const _settings = require('./settings.ts');
const _errors = require('./errors.ts');
const rand = require('./rand.ts');
const postprocessing = require('./postprocessing.ts');

const defaultBMLSettings = _settings.defaultBMLSettings;
const defaultRenderSettings = _settings.defaultRenderSettings;
const mergeSettings = _settings.mergeSettings;
const parsePrelude = _parsers.parsePrelude;
const parseUse = _parsers.parseUse;
const parseInlineCommand = _parsers.parseInlineCommand;
const EvalBlock = require('./evalBlock.ts').EvalBlock;
const FunctionCall = require('./functionCall.ts').FunctionCall;
const Lexer = require('./lexer.ts').Lexer;
const TokenType = require('./tokenType.ts').TokenType;
const noOp = require('./noOp.ts');
const UnknownModeError = _errors.UnknownModeError;
const BMLDuplicatedRefError = _errors.BMLDuplicatedRefError;
const IllegalStateError = _errors.IllegalStateError;
const BML_VERSION = require('../package.json')['version'];

/**
 * Check if the running version of bml aligns with a specified one.
 *
 * If the versions do not align, log a warning to the console.
 * If no version is specified, do nothing.
 *
 * @return {void}
 */
function checkVersion(bmlVersion, specifiedInSettings) {
  if (specifiedInSettings !== null) {
    if (specifiedInSettings !== bmlVersion) {
      console.warn('BML VERSION MISMATCH.' +
        ' bml source file specifies version ' + specifiedInSettings +
        ' but running version is ' + BML_VERSION + '.' +
        ' unexpected behavior may occur.');
    }
  }
}

function resolveBackReference(choiceResultMap, backReference) {
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
 *
 * If markdown postprocessing is enabled, it will be called at the end
 * of rule processing.
 *
 * @returns {String} the rendered text.
 */
function renderText(string, startIndex, modes, activeMode,
  userDefs, choiceResultMap, stackDepth) {
  // TODO this function is way too complex and badly needs refactor
  choiceResultMap = choiceResultMap || new Map();
  activeMode = activeMode || null;
  let isEscaped = false;
  let inVisualLineBreak = false;
  let inLiteralBlock = false;
  let out = '';
  let currentRule = null;
  let foundMatch = false;
  let replacement = null;
  let chooseRe = /\s*(\(|call|#?\w+:|@\w+)/y;
  let useRe = /\s*(use|using)/y;
  let token;
  let lexer = new Lexer(string);
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
        out += token.string;
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
          out += token.string;
        }
        break;
      case TokenType.OPEN_BRACE:
        chooseRe.lastIndex = token.index + 1;
        useRe.lastIndex = token.index + 1;
        if (chooseRe.test(string)) {
          let parseInlineCommandResult = parseInlineCommand(string, token.index, false);
          let replacer = parseInlineCommandResult.replacer;
          let backReference = parseInlineCommandResult.backReference;
          let replacerCallResult;
          if (replacer) {
            replacerCallResult = replacer.call();
            if (replacer.identifier) {
              if (choiceResultMap.has(replacer.identifier)) {
                throw new BMLDuplicatedRefError(replacer.identifier, string, token.index);
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
            renderedReplacement = replacement.execute(userDefs, null, string, token.index);
          } else {
            // To handle nested choices and to run rules over chosen text,
            // we recursively render the chosen text.
            renderedReplacement = renderText(
              replacement, 0, modes, activeMode, userDefs, choiceResultMap, stackDepth + 1);
          }
          if (!(replacer && replacer.isSilent)) {
            out += renderedReplacement;
          }
          if (replacerCallResult) {
            choiceResultMap.set(
              replacer.identifier,
              { choiceIndex: replacerCallResult.choiceIndex, renderedOutput: renderedReplacement });
          }
          lexer.overrideIndex(parseInlineCommandResult.blockEndIndex);
          continue;
        } else if (useRe.test(string)) {
          let parseUseResult = parseUse(string, token.index);
          lexer.overrideIndex(parseUseResult.blockEndIndex);
          if (modes.hasOwnProperty(parseUseResult.modeName)) {
            activeMode = modes[parseUseResult.modeName];
          } else {
            throw new UnknownModeError(string, token.index, parseUseResult.modeName);
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
              let currentMatch = currentRule.matchers[m].exec(string);
              if (currentMatch !== null) {
                replacement = currentRule.replacer.call().replacement;
                if (replacement instanceof FunctionCall) {
                  out += replacement.execute(userDefs, currentMatch, string, token.index);
                } else if (replacement === noOp) {
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
          out += token.string;
        }

        break;  // Break from `switch (token.tokenType)`
    }

    lexer.next();  // Consume token
  }

  return out;
}

/**
 * render a bml document.
 *
 * @param {String} bmlDocumentString - the bml text to process.
 * @param {Object} renderSettings - optional settings for this render,
 *     unrelated to the settings encoded in the bml document itself,
 *     which apply to every run of the document
 * @param {Object} renderSettings.randomSeed - the random seed to use for
 *     this render. Can be any type, as this is fed directly to the `seedrandom`
 *     library, which converts the object to a string and uses that as the
 *     actual seed
 * @param {Boolean} renderSettings.allowEval - set to `false` to ignore `eval`
 *     blocks in the document. This can be useful for security purposes.
 * @param {Boolean} renderSettings.renderMarkdown - whether to render the output
 *     document as markdown to HTML.
 * @param {Boolean} renderSettings.whitespaceCleanup - whether to perform a
 *     post-processing step cleaning up whitespace.
 *
 * @return {String} the processed and rendered text.
 */
function render(bmlDocumentString, renderSettings) {
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

  let userDefs = {};
  if (evalBlock && renderSettings.allowEval) {
    userDefs = evalBlock.execute();
    userDefs.settings = mergeSettings(defaultBMLSettings, userDefs.settings);
    checkVersion(BML_VERSION, userDefs.settings.version);
  }

  // Main render pass
  let output = renderText(
    bmlDocumentString, preludeEndIndex, modes, null, userDefs, null, 0);

  // Post-processing
  if (renderSettings.renderMarkdown) {
    output = postprocessing.renderMarkdown(output, userDefs.settings.markdownSettings);
  }
  if (renderSettings.whitespaceCleanup) {
    output = postprocessing.whitespaceCleanup(output);
  }

  return output;
}

exports.renderText = renderText;
exports.render = render;
