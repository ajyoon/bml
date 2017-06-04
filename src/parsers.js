var _rand = require('./rand.js');
var _errors = require('./errors.js');
var _stringUtils = require('./stringUtils.js');
var _rule = require('./rule.js');
var createRule = require('./rule.js').createRule;
var EvalBlock = require('./evalBlock.js').EvalBlock;
var Mode = require('./mode.js').Mode;

var UnknownTransformError = _errors.UnknownTransformError;
var UnknownModeError = _errors.UnknownModeError;
var JavascriptSyntaxError = _errors.JavascriptSyntaxError;
var BMLSyntaxError = _errors.BMLSyntaxError;
var lineAndColumnOf = _stringUtils.lineAndColumnOf;
var lineColumnString = _stringUtils.lineColumnString;
var isWhitespace = _stringUtils.isWhitespace;
var getWeightedOptionReplacer = _rand.getWeightedOptionReplacer;



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


/**
 * @returns {rule, ruleEndIndex} The newly parsed rule and the index of the end of the rule.
 *     Depending on the context, this may either be the beginning of a new rule or the end
 *     of the mode block.
 */
function parseRule(string, ruleStartIndex) {
  var inComment = false;
  var isEscaped = false;
  var currentString = null;
  var matchers = [];
  var options = [];
  var state = 'matchers';
  var canAcceptElement = false;
  var index = ruleStartIndex;
  var numberRe = /(\d+(\.\d+)?)|(\.\d+)/y;
  var numberMatch;
  var callRe = /call (\w+[\w\d\.]*)/y;
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
        if (!canAcceptElement && state === 'options') {
          return {
            rule: createRule(matchers, options),
            ruleEndIndex: index
          };
        } else {
          canAcceptElement = false;
          currentString = '';
        }
      } else if (string.slice(index, index + 2) === '//') {
        inComment = true;
      } else {
        switch (state) {
        case 'matchers':
          if (isWhitespace(string[index])) {
            break;
          } else if (string[index] === ',') {
            canAcceptElement = true;
          } else if (/as\s/.test(string.slice(index, index + 3))) {
            state = 'options';
            index += 3;
            canAcceptElement = true;
            continue;
          } else {
            throw new BMLSyntaxError('error parsing rule at index ' + index);
          }
          break;
        case 'options':
          numberRe.lastIndex = index;
          callRe.lastIndex = index;
          if (isWhitespace(string[index])) {
            break;
          } else if ((numberMatch = numberRe.exec(string))) {
            options[options.length - 1].chance = Number(numberMatch[0]);
            index += numberMatch[0].length;
            continue;
          } else if ((callMatch = callRe.exec(string))) {
            // TODO: is this wrong? Call matches should accept weights.
            options.push({
              option: new EvalBlock(callMatch[1]),
              chance: null
            });
            index += callMatch[0].length;
            canAcceptElement = false;
            continue;
          } else if (string[index] === ',') {
            canAcceptElement = true;
          } else if (string[index] === '}') {
            return {
              rule: createRule(matchers, options),
              ruleEndIndex: index
            };
          } else {
            throw new BMLSyntaxError('Unknown character in option at index ' + index);
          }
          break;
        default:
          if (!isWhitespace(string[index])) {
            throw new BMLSyntaxError('error parsing rule at index ' + index);
          }
        }
      }
    }
    index++;
  }
  throw new BMLSyntaxError('Could not find end of rule');
}


/**
 * @returns {mode, modeEndIndex} The newly parsed Mode and the index of the block-closing brace.
 */
function parseMode(string, modeNameIndex) {
  // Get mode name
  var openBraceIndex = string.indexOf('{', modeNameIndex);
  var name = string.slice(modeNameIndex,openBraceIndex).trim();
  var rule;
  var mode = new Mode(name);
  var state = 'mode';
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
        return {
          mode: mode,
          modeEndIndex: index
        };
      } else {
        var parseRuleResults = parseRule(string, index);
        mode.rules.push(parseRuleResults.rule);
        index = parseRuleResults.ruleEndIndex;
        continue;
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
 * @returns {preludeEndIndex, evalBlock, modes, initialMode}
 */
function parsePrelude(string) {
  var modes = {};
  var initialMode;
  var beginPattern = /^\s*begin( (using|use) (\w+))? *\n/m;
  var evalPattern = /^\s*evaluate {/gm;
  var modePattern = /^\s*mode (\w+) *{/gm;
  var beginMatch = string.match(beginPattern);
  var evalString = '';
  if (beginMatch !== null) {
    var beginIndex = beginMatch.index;
    var prelude = string.slice(0, beginIndex);
    var evalMatch;
    while ((evalMatch = evalPattern.exec(prelude)) !== null) {
      var codeEndIndex = findCodeBlockEnd(prelude, evalPattern.lastIndex - 1);
      evalString += prelude.slice(evalPattern.lastIndex, codeEndIndex - 1) + '\n';
    }

    var modeBlock;
    while ((modeBlock = modePattern.exec(prelude)) !== null) {
      var modeNameIndex = modeBlock.index + modeBlock[0].indexOf(modeBlock[1]);
      var {mode, modeEndIndex} = parseMode(prelude, modeNameIndex);
      modes[mode.name] = mode;
    }

    var modeName = beginMatch[3];
    if (modeName !== undefined) {
      if (modes.hasOwnProperty(modeName)) {
        initialMode = modes[modeName];
      } else {
        throw new UnknownModeError(String, beginMatch.index, modeName);
      }
    }

  } else {
    // No begin pattern found - assume there is no prelude.
    return {
      preludeEndIndex: 0,
      evalBlock: null,
      modes: {},
      initialMode: null
    };
  }
  return {
    preludeEndIndex: beginMatch.index + beginMatch[0].length,
    evalBlock: new EvalBlock(evalString),
    modes: modes,
    initialMode: initialMode
  };
}

/**
 * Parse a `use` block of the form `{{use|using modeName}}`
 *
 * @returns {blockEndIndex, modeName} The returned index is the index immediately
 * after the closing brace.
 */
function parseUse(string, openBraceIndex) {
  var useRe = /{{(use|using)\s+(\w[\w\d]*)\s*}}/y;
  useRe.lastIndex = openBraceIndex;
  var match = useRe.exec(string);
  if (match === null) {
    throw new UnknownTransformError(string, openBraceIndex);
  }
  return {
    blockEndIndex: useRe.lastIndex,
    modeName: match[2]
  };
}

// TODO: use me in similar logic in other parsers
// {closeQuoteIndex, extractedString}
function parseStringLiteral(string, openQuoteIndex) {
  var index = openQuoteIndex + 1;
  var isEscaped = false;
  while (index < string.length) {
    if (isEscaped) {
      isEscaped = false;
    } else {
      if (string[index] === '\\') {
        isEscaped = true;
      } else if (string[index] === '\'') {
        return {
          closeQuoteIndex: index,
          extractedString: string.slice(openQuoteIndex + 1, index)
        };
      }
    }
    index++;
  }
  throw new BMLSyntaxError('could not find end of string at index: '
                           + openQuoteIndex);
}


// {lastDigitIndex, extractedNumber}
function extractNumberLiteral(string, numberIndex) {
  var numberRe = /(\d+(\.\d+)?)|(\.\d+)/y;
  numberRe.lastIndex = numberIndex;
  var match = numberRe.exec(string);
  if (match === null) {
    return null;
  }
  return {
    lastDigitIndex: numberIndex + match[0].length,
    extractedNumber: Number(match[0])
  };
}


/**
 * Parse an option block.
 *
 * @returns {blockEndIndex, replacementFunction}
 */
function parseChoose(string, openBraceIndex) {
  var index = openBraceIndex + 2;
  var numberRe = /(\d+(\.\d+)?)|(\.\d+)/y;
  var callRe = /call (\w+[\w\d\.]*)/y;
  var state = 'code';
  var acceptOption = true;;
  var options = [];
  var currentOption = null;
  var currentWeight = null;
  while (index < string.length) {
    if (isWhitespace(string[index])) {
      // Ignore
    } else if (string.slice(index, index + 2) === '}}') {
      if (currentOption !== null) {
        options.push({option: currentOption, weight: currentWeight});
      }
      return {
        blockEndIndex: index + 1,
        replacementFunction: getWeightedOptionReplacer(options)
      };
    } else if (acceptOption) {
      callRe.lastIndex = index;
      var callMatch = callRe.exec(string);
      if (string[index] === '\'') {
        acceptOption = false;
        var literalExtractionResult = parseStringLiteral(string, index);
        currentOption = literalExtractionResult.extractedString;
        index = literalExtractionResult.closeQuoteIndex;
      } else if (callMatch !== null) {
        acceptOption = false;
        currentOption = new EvalBlock(callMatch[1]);
        index += callMatch[0].length - 1;
      } else {
        throw new BMLSyntaxError('Unexpected character at: ' + index);
      }
    } else {
      numberRe.lastIndex = index;
      var numberMatch = numberRe.exec(string);
      if (string[index] === ',') {
        acceptOption = true;
        options.push({option: currentOption, weight: currentWeight});
        currentOption = null;
        currentWeight = null;
      } else if (numberMatch !== null) {
        if (currentOption !== null) {
          currentWeight = Number(numberMatch[0]);
        } else {
          throw new BMLSyntaxError(
            'Cannot have a weight without an option. Index: ' + index);
        }
      } else {
        throw new BMLSyntaxError('Invalid syntax at: ' + index);
      }
    }
    index++;
  }
  throw new BMLSyntaxError('Could not find end of choice block at index: '
                           + openBraceIndex);
}


exports.findCodeBlockEnd = findCodeBlockEnd;
exports.parseRule = parseRule;
exports.parseMode = parseMode;
exports.parsePrelude = parsePrelude;
exports.parseUse = parseUse;
exports.parseStringLiteral = parseStringLiteral;
exports.parseChoose = parseChoose;
