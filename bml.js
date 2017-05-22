var _mode = require('./mode.js');
var _errors = require('./errors.js');
var _rand = require('./rand.js');
var _rule = require('./rule.js');
var _stringUtils = require('./stringUtils.js');

var Mode = _mode.Mode;
var Rule = _rule.Rule;
var BMLSyntaxError = _errors.BMLSyntaxError;
var JavascriptSyntaxError = _errors.JavascriptSyntaxError;
var UnknownModeError = _errors.UnknownModeError;

var normalizeWeights = _rand.normalizeWeights;

var lineAndColumnOf = _stringUtils.lineAndColumnOf;
var lineColumnString = _stringUtils.lineColumnString;
var isWhitespace = _stringUtils.isWhitespace;

var getWeightedOptionReplacer = _rule.getWeightedOptionReplacer;

settings = {
  renderMarkdown: false,
  contextSize: 20
};

modes = {};

activeMode = null;

function changeSettings(newSettings) {
  Object.keys(newSettings).forEach(function(key, index) {
    if (settings.hasOwnProperty(key)) {
      settings[key] = newSettings[key];
    }
  });
}

/**
 * Extract an arbitrary javascript block enclosed in braces
 * @returns (Number) the index after the ending curly brace.
 */
function findCodeBlockEnd(string, curlyBraceStartIndex) {
  var openBraceCount = 0;
  var state = 'code';
  var isEscaped = false;
  var index = curlyBraceStartIndex;
  while(openBraceCount >= 0) {
    index++;
    if (index > string.length) {
      throw new Error('Syntax error extracting javascript. No close-brace found.');
    }
    switch (state) {
    case 'block':
      if (string.slice(index, index + 2) === '*/') {
        state = 'code';
      }
      break;
    case 'inline':
      if (string[index] === '\n') {
        state = 'code';
      }
      break;
    case 'backtick string':
      if (string[index] === '`' && !isEscaped) {
        state = 'code';
      }
      break;
    case 'single-quote string':
    if (string[index] === '\'' && !isEscaped) {
        state = "code";
      } else if (string[index] === '\n') {
        throw new JavascriptSyntaxError(string, index);
      }
      break;
    case 'double-quote string':
      if (string[index] === '"' && !isEscaped) {
        state = "code";
      } else if (string[index] === '\n') {
        throw new JavascriptSyntaxError(string, index);
      }
      break;
    case 'regex literal':
      if (string[index] === '/' && !isEscaped) {
        state = 'code';
      }
      break;
    case 'code':
      if (string[index] === '{') {
        openBraceCount++;
      } else if (string[index] === '}') {
        openBraceCount--;
      } else if (string.slice(index, index + 2) === '//') {
        state = 'inline';
      } else if (string.slice(index, index + 2) === '/*') {
        state = 'block';
      } else if (string[index] === '`') {
        state = 'backtick string';
      } else if (string[index] === '\'') {
        state = 'single-quote string';
      } else if (string[index] === '\"') {
        state = 'double-quote string';
      } else if (string[index] === '/' && string[index - 1] !== '*') {
        state = 'regex literal';
      }
      break;
    default:
      throw new Error('Invalid state: ' + state);
    }
    if (string[index] === '\\') {
      isEscaped = !isEscaped;
    } else {
      if (isEscaped) {
        isEscaped = false;
      }
    }
  }
  return index + 1;
}

function getModes() {
  return modes;
}

function setModes(newModes) {
  modes = newModes;
}

function getActiveMode() {
  return activeMode;
}

function setActiveMode(newMode) {
  activeMode = newMode;
}

function assembleRule(matchers, options, mode) {
  var rule = new Rule(matchers);
  rule.getReplacement = getWeightedOptionReplacer(options);
  mode.rules.push(rule);
}

function parseRule(string, ruleStartIndex, mode) {
  var inComment = false;
  var isEscaped = false;
  var currentString = null;
  var matchers = [];
  var options = [];
  var state = 'matchers';
  var afterComma = false;
  var index = ruleStartIndex;
  var numberRe = /(\d+(\.\d+)?)|(\.\d+)/g;
  var numberMatch;
  var callRe = /call \w+[\w|\d]* {/g;
  var callMatch;
  while (index < string.length) {
    if (inComment) {
      if (string[index] === '\n') {
        inComment = false;
      }

    } else if (currentString !== null) {
      // Inside string literal
      if (isEscaped) {
        if (string[index] === 'n') {
          currentString += '\n';
        } else {
          currentString += string[index];
        }
        isEscaped = false;
      } else {
        if (string[index] === '\\') {
          isEscaped = true;
        } else if (string[index] === '\'') {
          // end of string
          if (state === 'matchers') {
            matchers.push(currentString);
          } else {
            options.push({option: currentString, chance: null});
          }
          currentString = null;
        } else {
          currentString += string[index];
        }
      }

    } else {
      if (string[index] === '\'') {
        afterComma = false;
        currentString = '';
      } else if (string.slice(index, index + 2) === '//') {
        inComment = true;
      } else {
        if (afterComma) {
          if (!isWhitespace(string[index])) {
            throw new BMLSyntaxError('error parsing rule at index ' + index);
          }
        } else {
          switch (state) {
          case 'matchers':
            if (isWhitespace(string[index])) {
              break;
            } else if (string[index] === ',') {
              afterComma = true;
            } else if (/as\s/.test(string.slice(index, index + 3))) {
              state = 'options';
              index += 3;
              continue;
            } else {
              throw new BMLSyntaxError('error parsing rule at index ' + index);
            }
            break;
          case 'options':
            numberRe.lastIndex = index;
            if (isWhitespace(string[index])) {
              break;
            } else if ((numberMatch = numberRe.exec(string))) {
              options[options.length - 1].chance = Number(numberMatch[0]);
              index += numberMatch[0].length;
              continue;
            } else if (string[index] === ',') {
              afterComma = true;
            } else if (string[index] === '\'' || string[index] === '}') {
              assembleRule(matchers, options, mode);
              return index;
            } else {
              throw new BMLSyntaxError('Unknown character in option at index ' + index);
            }
            break;
          default:
            throw new Error('Unknown state: ' + state);
          }
        }
      }
    }
    index++;
  }
  console.log('inComment: ' + inComment);
  console.log('isEscaped: ' + isEscaped);
  console.log('currentString: ' + currentString);
  console.log('matchers: ' + matchers);
  console.log('options: ' + options);
  console.log('state: ' + state);
  console.log('afterComma: ' + afterComma);
  console.log('index: ' + index);
  throw new BMLSyntaxError('Could not find end of rule');
}
// TODO: return index behavior in rule parsing has changed,
// parseMode needs to be updated accordingly

/**
 * @returns {Number} the index of the closing brace of the mode.
 */
function parseMode(string, modeNameIndex) {
  // Get mode name
  var openBraceIndex = string.indexOf('{', modeNameIndex);
  var name = string.slice(modeNameIndex,openBraceIndex).trim();
  var mode = new Mode(name);
  var state = 'mode';
  modes[name] = mode;
  var index = openBraceIndex + 1;
  while (index < string.length) {
    switch (state) {
    case 'comment':
      if (string[index] === '\n') {
        state = 'mode';
      }
      break;
    case 'mode':
      if ('\n\t '.indexOf(string[index]) !== -1) {
        break;
      } else if (string.slice(index, index + 2) === '//') {
        state = 'comment';
      } else if (string[index] === '}') {
        return index;
      } else {
        // Rule encountered. (Go through exports for mocking)
        index = exports.parseRule(string, index, mode);
      }
      break;
    default:
      throw Error('Invalid state: ' + state);
    }
    index++;
  }
  throw new BMLSyntaxError('Could not find end of mode: ' + name);
}

/**
 * Parse the prelude of a bml file.
 *
 * @param {String} string The contents of a bml file
 * @returns {Number} the index after the end of the 'begin' statement.
 */
function parsePrelude(string) {
  var beginPattern = /^\s*begin( using (\w+))? *\n/m;
  var evalPattern = /^\s*evaluate {/gm;
  var modePattern = /^\s*mode (\w+) *{/gm;
  var beginMatch = string.match(beginPattern);
  if (beginMatch !== null) {
    var beginIndex = beginMatch.index;
    var prelude = string.slice(0, beginIndex);

    var evalBlock;
    while ((evalBlock = evalPattern.exec(prelude)) !== null) {
      var codeEndIndex = findCodeBlockEnd(prelude, evalPattern.lastIndex - 1);
      eval(prelude.slice(evalPattern.lastIndex, codeEndIndex - 1));
    }

    var modeBlock;
    while ((modeBlock = modePattern.exec(prelude)) !== null) {
      var modeNameIndex = modeBlock.index + modeBlock[0].indexOf(modeBlock[1]);
      var modeEndIndex = exports.parseMode(prelude, modeNameIndex);

    }

    var modeName = beginMatch[2];
    if (modeName !== undefined) {
      if (modes.hasOwnProperty(modeName)) {
        setActiveMode(modes[modeName]);
      } else {
        throw new UnknownModeError(string, beginMatch.index, modeName);
      }
    }

  } else {
    // No begin pattern found - assume there is no prelude.
    return 0;
  }
  return beginMatch.index + beginMatch[0].length;
}


// For testing purposes only.
function __unpackPrivates() {
  for (property in exports._private) {
    if (exports._private.hasOwnProperty(property)) {
      exports[property] = exports._private[property];
    }
  }
}

exports.settings = settings;
exports.changeSettings = changeSettings;
exports.getModes = getModes;
exports.setModes = setModes;
exports.getActiveMode = getActiveMode;
exports.setActiveMode = setActiveMode;
exports.JavascriptSyntaxError = JavascriptSyntaxError;
exports.UnknownModeError = UnknownModeError;
exports.BMLSyntaxError = BMLSyntaxError;
exports._private = {
  __unpackPrivates: __unpackPrivates,
  findCodeBlockEnd: findCodeBlockEnd,
  lineAndColumnOf: lineAndColumnOf,
  parseRule: parseRule,
  parsePrelude: parsePrelude,
  parseMode: parseMode,
  Mode: Mode,
  normalizeWeights: normalizeWeights
};
