var _mode = require('./mode.js');
var _errors = require('./errors.js');
var _rand = require('./rand.js');
var _stringUtils = require('./stringUtils.js');

var Mode = _mode.Mode;
var BMLSyntaxError = _errors.BMLSyntaxError;
var JavascriptSyntaxError = _errors.JavascriptSyntaxError;
var UnknownModeError = _errors.UnknownModeError;

var normalizeWeights = _rand.normalizeWeights;

var lineAndColumnOf = _stringUtils.lineAndColumnOf;
var lineColumnString = _stringUtils.lineColumnString;

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

function parseRule(string, ruleStartIndex, mode) {
  //stub
  throw new Error('not implemented');
}

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
