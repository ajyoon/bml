const _parsers = require('./parsers.js');
const _settings = require('./settings.js');
const _errors = require('./errors.js');
const rand = require('./rand.js');
const postprocessing = require('./postprocessing.js');

const defaultBMLSettings = _settings.defaultBMLSettings;
const defaultRenderSettings = _settings.defaultRenderSettings;
const mergeSettings = _settings.mergeSettings;
const parsePrelude = _parsers.parsePrelude;
const parseUse = _parsers.parseUse;
const parseInlineCommand = _parsers.parseInlineCommand;
const EvalBlock = require('./evalBlock.js').EvalBlock;
const noOp = require('./noOp.js');
const UnknownModeError = _errors.UnknownModeError;
const BMLDuplicatedRefError = _errors.BMLDuplicatedRefError;
const BML_VERSION = require('../package.json')['version'];

// imports for exposure to eval blocks
/* eslint-disable no-unused-vars */
const WeightedChoice = require('./weightedChoice.js').WeightedChoice;
const weightedChoose = rand.weightedChoose;
const randomInt = rand.randomInt;
const randomFloat = rand.randomFloat;
/* eslint-enable no-unused-vars */

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
    if (matchedBackReferenceResult) {
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
function renderText(string, startIndex, evalBlock, modes, activeMode,
                    settings, renderSettings, choiceResultMap, isTopLevel) {
  // TODO this function is way too complex and badly needs refactor
  // TODO replace isTopLevel with incrementing depth tracker
  choiceResultMap = choiceResultMap || new Map();
  activeMode = activeMode || null;
  let isEscaped = false;
  let inLiteralBlock = false;
  let out = '';
  let index = startIndex;
  let currentRule = null;
  let foundMatch = false;
  let replacement = null;
  let chooseRe = /\s*(\(|call|#?\w+:|@\w+)/y;
  let useRe = /\s*(use|using)/y;

  // Eval any eval block, resolve settings, do version check
  // This has to be done inside this function so that things
  // defined in the eval block can be accessed by other eval
  // blocks exeecuted in this scope.
  if (isTopLevel) {
    if (evalBlock) {
      eval(evalBlock.string);
    }
    if (settings) {
      settings = mergeSettings(defaultBMLSettings, settings);
    } else {
      var settings = defaultBMLSettings;
    }
    checkVersion(BML_VERSION, settings.version);
  }

  while (index < string.length) {
    if (isEscaped) {
      isEscaped = false;
      out += string[index];
    } else if (inLiteralBlock) {
      if (string[index] === '\\') {
        isEscaped = true;
      } else if (string.slice(index, index + 2) === ']]') {
        inLiteralBlock = false;
        index += 2;
        continue;
      } else {
        out += string[index];
      }
    } else if (string.slice(index, index + 1) === '{') {
      chooseRe.lastIndex = index + 1;
      useRe.lastIndex = index + 1;
      if (chooseRe.test(string)) {
        let parseInlineCommandResult = parseInlineCommand(string, index, false);
        let replacer = parseInlineCommandResult.replacer;
        let backReference = parseInlineCommandResult.backReference;
        let replacerCallResult;
        if (replacer) {
          replacerCallResult = replacer.call();
          if (replacer.identifier) {
            if (choiceResultMap.has(replacer.identifier)) {
              throw new BMLDuplicatedRefError(replacer.identifier, string, index);
            }
          }
          replacement = replacerCallResult.replacement;
        } else {
          // sanity check
          if (!backReference) {
            throw new Error('Illegal state - no replacer or backref from inline choose');
          }
          replacement = resolveBackReference(choiceResultMap, backReference);
        }
        let renderedReplacement;
        if (replacement instanceof EvalBlock) {
          renderedReplacement = eval(replacement.string)([''], string, index);
        } else {
          // To handle nested choices and to run rules over chosen text,
          // we recursively render the chosen text.
          renderedReplacement = renderText(
            replacement, 0, null, modes, activeMode,
            settings, renderSettings, choiceResultMap, false);
        }
        if (!(replacer && replacer.isSilent)) {
          out += renderedReplacement;
        }
        if (replacerCallResult) {
          choiceResultMap.set(
            replacer.identifier,
            { choiceIndex: replacerCallResult.choiceIndex, renderedOutput: renderedReplacement});
        }
        index = parseInlineCommandResult.blockEndIndex;
        continue;
      } else if (useRe.test(string)) {
        let parseUseResult = parseUse(string, index);
        index = parseUseResult.blockEndIndex;
        if (modes.hasOwnProperty(parseUseResult.modeName)) {
          activeMode = modes[parseUseResult.modeName];
        } else {
          throw new UnknownModeError(string, index, parseUseResult.modeName);
        }
      }
    } else {
      if (string[index] === '\\') {
        isEscaped = true;
      } else if (string.slice(index, index + 2) === '[[') {
        index++;
        inLiteralBlock = true;
      } else {
        if (activeMode !== null) {
          ruleLoop:
          for (let r = 0; r < activeMode.rules.length; r++) {
            currentRule = activeMode.rules[r];
            for (let m = 0; m < currentRule.matchers.length; m++) {
              currentRule.matchers[m].lastIndex = index;
              let currentMatch = currentRule.matchers[m].exec(string);
              if (currentMatch !== null) {
                replacement = currentRule.replacer.call().replacement;
                if (replacement instanceof EvalBlock) {
                  out += eval(replacement.string)(currentMatch, string, index);
                } else if (replacement === noOp) {
                  out += currentMatch[0];
                } else {
                  // To handle nested choices and to run rules over replaced text,
                  // we recursively render the chosen text.
                  let renderedReplacement = renderText(
                    replacement, 0, null, modes, activeMode,
                    settings, renderSettings, choiceResultMap, false);
                  out += renderedReplacement;
                }
                index += currentMatch[0].length;
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
          out += string[index];
        }
      }
    }
    index++;
  }

  if (isTopLevel) {
    // Postprocessing
    if (renderSettings.renderMarkdown) {
      out = postprocessing.renderMarkdown(out, settings.markdownSettings);
    }

    if (renderSettings.whitespaceCleanup) {
      out = postprocessing.whitespaceCleanup(out);
    }
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

  // Main render pass
  let output = renderText(
    bmlDocumentString, preludeEndIndex, evalBlock, modes, null,
    null, renderSettings, null, true);

  return output;
}

exports.renderText = renderText;
exports.render = render;
