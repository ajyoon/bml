const marked = require('marked');

const _parsers = require('./parsers.js');
const _settings = require('./settings.js');
const _errors = require('./errors.js');
const rand = require('./rand.js');

const defaultSettings = _settings.defaultSettings;
const mergeSettings = _settings.mergeSettings;
const parsePrelude = _parsers.parsePrelude;
const parseUse = _parsers.parseUse;
const parseInlineChoose = _parsers.parseInlineChoose;
const EvalBlock = require('./evalBlock.js').EvalBlock;
const noOp = require('./noOp.js');
const UnknownModeError = _errors.UnknownModeError;
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
  } else {
    console.warn(
      'no bml version specified in settings, unexpected behavior may occur.');
  }
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
function renderText(string, startIndex, evalBlock,
                    modes, renderDefaultSettings, isTopLevel) {
  let activeMode = null;
  let isEscaped = false;
  let inLiteralBlock = false;
  let out = '';
  let index = startIndex;
  let currentRule = null;
  let foundMatch = false;
  let replacement = null;
  let chooseRe = /\s*(\(|call)/y;
  let useRe = /\s*(use|using)/y;

  if (isTopLevel) {
    if (evalBlock) {
      eval(evalBlock.string);
    }

    let baseSettings = renderDefaultSettings ?
        mergeSettings(defaultSettings, renderDefaultSettings) : defaultSettings;

    if (settings) {
      settings = mergeSettings(baseSettings, settings);
    } else {
      var settings = baseSettings;
    }
    checkVersion(BML_VERSION, settings.version);
  } else {
    var settings = renderDefaultSettings;
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
        let parseInlineChooseResult = parseInlineChoose(string, index, false);
        replacement = parseInlineChooseResult.replacer.call().replacement;
        if (replacement instanceof EvalBlock) {
          out += eval(replacement.string)([''], string, index);
        } else {
          // To handle nested choices and to run rules over chosen text,
          // we recursively render the chosen text.
          let renderedReplacement = renderText(
            replacement, 0, null, modes, activeMode, settings, false);
          out += renderedReplacement;
        }
        index = parseInlineChooseResult.blockEndIndex;
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
                    replacement, 0, null, modes, activeMode, settings, false);
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

  if (settings.renderMarkdown) {
    out = marked(out, settings.markdownSettings);
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
 * @param {Boolean} renderSettings.allowEval - Set to `false` to ignore `eval`
 *     blocks in the document. This can be useful for security purposes.
 * @param {Object} defaultDocumentSettings - Optional default *document* settings
 *     which override the global defaults.
 *
 * @return {String} the processed and rendered text.
 */
function render(bmlDocumentString, renderSettings, defaultDocumentSettings) {
  let allowEval = true;
  if (renderSettings) {
    if (renderSettings.hasOwnProperty('randomSeed')) {
      rand.setRandomSeed(renderSettings.randomSeed);
    }
    if (renderSettings.hasOwnProperty('allowEval')) {
      allowEval = renderSettings.allowEval;
    }
  }
  let {
    preludeEndIndex,
    evalBlock,
    modes,
  } = parsePrelude(bmlDocumentString);
  if (!allowEval) {
    evalBlock = null;
  }
  return renderText(
    bmlDocumentString, preludeEndIndex, evalBlock, modes, defaultDocumentSettings, true);
}

exports.renderText = renderText;
exports.render = render;
