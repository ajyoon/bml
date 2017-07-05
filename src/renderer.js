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

/**
 * We import many functions which are not directly used in the module
 * so that embedded code in bml documents can access them.
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
  let chooseRe = /\s*('|call)/y;
  let useRe = /\s*(use|using)/y;

  if (evalBlock) {
    eval(evalBlock.string);
  }

  if (typeof settings === 'undefined') {
    var settings = defaultSettings;
  } else {
    settings = mergeSettings(defaultSettings, settings);
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

function render(string) {
  let {preludeEndIndex, evalBlock, modes, initialMode} = parsePrelude(string);
  return renderText(string, preludeEndIndex, evalBlock, modes, initialMode);
}

exports.renderText = renderText;
exports.render = render;
