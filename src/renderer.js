var marked = require('marked');

var _parsers = require('./parsers.js');
var _settings = require('./settings.js');
var _errors = require('./errors.js');

var defaultSettings = _settings.defaultSettings;
var mergeSettings = _settings.mergeSettings;
var parsePrelude = _parsers.parsePrelude;
var parseUse = _parsers.parseUse;
var parseChoose = _parsers.parseChoose;
var EvalBlock = require('./evalBlock.js').EvalBlock;
var noOp = require('./noOp.js');
var UnknownModeError = _errors.UnknownModeError;

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
  var isEscaped = false;
  var inLiteralBlock = false;
  var out = '';
  var index = startIndex;
  var currentRule = null;
  var foundMatch = false;
  var replacement = null;
  var chooseRe = /\s*('|call)/y;
  var useRe = /\s*(use|using)/y;

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
          var parseChooseResult = parseChoose(string, index, false);
        replacement = parseChooseResult.replacer.call(
          [''], string, index);
        if (replacement instanceof EvalBlock) {
            console.log(replacement);
          out += eval(replacement.string)([''], string, index);
        } else {
          out += replacement;
        }
        index = parseChooseResult.blockEndIndex;
      } else if (useRe.test(string)) {
        var parseUseResult = parseUse(string, index);
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
        // Optimize me when extending to support regexps
        if (activeMode !== null) {
          ruleLoop:
          for (var r = 0; r < activeMode.rules.length; r++) {
            currentRule = activeMode.rules[r];
            for (var m = 0; m < currentRule.matchers.length; m++) {
              currentRule.matchers[m].lastIndex = index;
              var currentMatch = currentRule.matchers[m].exec(string);
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
    out = marked(out);
  }
  return out;
}

function render(string) {
  var {preludeEndIndex, evalBlock, modes, initialMode} = parsePrelude(string);
  return renderText(string, preludeEndIndex, evalBlock, modes, initialMode);
}

exports.renderText = renderText;
exports.render = render;
