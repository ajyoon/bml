var _mode = require('./mode.js');
var _errors = require('./errors.js');
var _rand = require('./rand.js');

var Mode = _mode.Mode;
var BMLSyntaxError = _errors.BMLSyntaxError;
var JavascriptSyntaxError = _errors.JavascriptSyntaxError;

var normalizeWeights = _rand.normalizeWeights;

settings = {
  renderMarkdown: false,
  contextSize: 20
};

modes = {};

function changeSettings(newSettings) {
  Object.keys(newSettings).forEach(function(key, index) {
    if (settings.hasOwnProperty(key)) {
      settings[key] = newSettings[key];
    }
  });
}

function lineAndColumnOf(string, charIndex) {
  if (charIndex > string.length) {
    throw new Error('charIndex > string.length');
  }
  var line = 1;
  var column = -1;
  var newLine = false;
  for (var i = 0; i <= charIndex; i++) {
    if (newLine) {
      line++;
      column = 0;
      newLine = false;
    } else {
      column++;
    }
    if (string[i] === '\n') {
      newLine = true;
    }
  }
  return {line: line, column: column};
}

function lineColumnString(string, charIndex) {
  var lineAndColumn = lineAndColumnOf(string, charIndex);
  return 'line: ' + lineAndColumn.line + ', column: ' + lineAndColumn.column;
}

/**
 * Extract an arbitrary javascript block enclosed in braces
 * @returns (Number) the index after the ending curly brace.
 */
function extractJavascript(string, curlyBraceStartIndex) {
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
        throw new Error('Syntax error in javascript at '
                        + lineColumnString(string, index)
                        + '  ' + string.slice(index-10, index+10));
      }
      break;
    case 'double-quote string':
      if (string[index] === '"' && !isEscaped) {
        state = "code";
      } else if (string[index] === '\n') {
        throw new Error('Syntax error in javascript at '
                        + lineColumnString(string, index)
                        + '  ' + string.slice(index-10, index+10));
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

function parseRule(string, ruleStartIndex, mode) {
  //stub
  throw new Error('not implemented');
}

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
 * @returns {Number} the index of the start of the first line after the prelude.
 */
function parsePrelude(string) {

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
exports._private = {
  __unpackPrivates: __unpackPrivates,
  extractJavascript: extractJavascript,
  lineAndColumnOf: lineAndColumnOf,
  parseRule: parseRule,
  parseMode: parseMode,
  Mode: Mode,
  normalizeWeights: normalizeWeights
};
