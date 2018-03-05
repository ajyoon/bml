let marked = require('marked');

let _parsers = require('./parsers.js');
let _settings = require('./settings.js');
let _errors = require('./errors.js');

let defaultSettings = _settings.defaultSettings;
let mergeSettings = _settings.mergeSettings;
let parsePrelude = _parsers.parsePrelude;
let parseUse = _parsers.parseUse;
let parseInlineChoose = _parsers.parseInlineChoose;
let EvalBlock = require('./evalBlock.js').EvalBlock;
let noOp = require('./noOp.js');
let UnknownModeError = _errors.UnknownModeError;
let BML_VERSION = require('../package.json')['version'];


/**
 * Check if the running version of bml aligns with a specified one.
 *
 * If the versions do not align, log a warning to the console.
 *
 * TODO: support semver comparisons?
 *
 * @returns {void}
 */
function checkVersion(bmlVersion, specifiedInSettings) {
  if (specifiedInSettings !== null && specifiedInSettings !== bmlVersion) {
    if (specifiedInSettings !== BML_VERSION) {
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
 * We import many functions which are not directly used in the module
 * so that embedded code in bml documents can access them.
 *
 * TODO: actually do this
 */

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
function renderText(string, startIndex, evalBlock, modes, activeMode) {
  let isEscaped = false;
  let inLiteralBlock = false;
  let out = '';
  let index = startIndex;
  let currentRule = null;
  let foundMatch = false;
  let replacement = null;
  let chooseRe = /\s*(['"]|call)/y;
  let useRe = /\s*(use|using)/y;

  if (evalBlock) {
    eval(evalBlock.string);
  }

  if (settings) {
    settings = mergeSettings(defaultSettings, settings);
  } else {
    var settings = defaultSettings;
  }

  checkVersion(BML_VERSION, settings.version);

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
    } else if (string.slice(index, index + 2) === '{{') {
      chooseRe.lastIndex = index + 2;
      useRe.lastIndex = index + 2;
      if (chooseRe.test(string)) {
        let parseInlineChooseResult = parseInlineChoose(string, index, false);
        replacement = parseInlineChooseResult.replacer.call(
          [''], string, index);
        if (replacement instanceof EvalBlock) {
          out += eval(replacement.string)([''], string, index);
        } else {
          out += replacement;
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
                replacement = currentRule.replacer
                  .call(currentRule.matchers[m], string, index);
                if (replacement instanceof EvalBlock) {
                  out += eval(replacement.string)(currentMatch, string, index);
                } else if (replacement === noOp) {
                  out += currentMatch[0];
                } else {
                  out += replacement;
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
 * @return {String} the processed and rendered text.
 */
function render(bmlDocumentString) {
  let {
    preludeEndIndex,
    evalBlock,
    modes,
    initialMode,
  } = parsePrelude(bmlDocumentString);
  return renderText(
    bmlDocumentString, preludeEndIndex, evalBlock, modes, initialMode);
}

exports.renderText = renderText;
exports.render = render;
