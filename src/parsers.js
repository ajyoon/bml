let _rand = require('./rand.js');
let _errors = require('./errors.js');
let _stringUtils = require('./stringUtils.js');
let createRule = require('./rule.js').createRule;
let EvalBlock = require('./evalBlock.js').EvalBlock;
let Mode = require('./mode.js').Mode;
let WeightedChoice = require('./weightedChoice.js').WeightedChoice;
let Lexer = require('./lexer.js').Lexer;
let TokenType = require('./tokenType.js').TokenType;

let UnknownTransformError = _errors.UnknownTransformError;
let UnknownModeError = _errors.UnknownModeError;
let JavascriptSyntaxError = _errors.JavascriptSyntaxError;
let BMLSyntaxError = _errors.BMLSyntaxError;
let escapeRegExp = _stringUtils.escapeRegExp;
let createWeightedOptionReplacer = _rand.createWeightedOptionReplacer;


/**
 * Parse an `eval` block
 *
 * @param {Lexer} lexer - A lexer whose next token is KW_EVAL. This will be
 *     mutated in place such that when the method returns, the lexer's next
 *     token will be after the closing brace of the block.
 * @return {EvalBlock} An EvalBlock extracted from the block
 * @throws {BMLSyntaxError} If the lexer is not at an eval block
 * @throws {JavascriptSyntaxError} If the javascript snippet inside the eval
 *     block contains a syntax error which makes parsing it impossible.
 */
function parseEval(lexer) {
  if (lexer.peek().tokenType !== TokenType.KW_EVAL) {
    throw new BMLSyntaxError(
      'eval blocks must start with keyword "eval"',
      lexer.string, lexer.index);
  }
  lexer.next(); // consume KW_EVAL
  lexer.skipWhitespaceAndComments();
  if (lexer.peek().tokenType !== TokenType.OPEN_BRACE) {
    throw new BMLSyntaxError(
      'eval blocks must be opened with a curly brace ("{")',
      lexer.string, lexer.index);
  }
  lexer.next(); // consume OPEN_BRACE

  let state = 'code';
  let index = lexer.index;
  let startIndex = index;
  let openBraceCount = 1;
  let token;
  while ((token = lexer.next()) !== null) {
    switch (state) {
    case 'block comment':
      if (token.tokenType === TokenType.CLOSE_BLOCK_COMMENT) {
        state = 'code';
      }
      break;
    case 'inline comment':
      if (token.tokenType === TokenType.NEW_LINE) {
        state = 'code';
      }
      break;
    case 'template literal':
      if (token.tokenType === TokenType.BACKTICK) {
        state = 'code';
      }
      break;
    case 'single-quote string':
      if (token.tokenType === TokenType.SINGLE_QUOTE) {
        state = 'code';
      } else if (token.tokenType === TokenType.NEW_LINE) {
        throw new JavascriptSyntaxError(lexer.string, lexer.index);
      }
      break;
    case 'double-quote string':
      if (token.tokenType === TokenType.DOUBLE_QUOTE) {
        state = 'code';
      } else if (token.tokenType === TokenType.NEW_LINE) {
        throw new JavascriptSyntaxError(lexer.string, lexer.index);
      }
      break;
    case 'regexp literal':
      if (token.tokenType === TokenType.SLASH) {
        state = 'code';
      }
      break;
    case 'code':
      switch (token.tokenType) {
      case TokenType.OPEN_BRACE:
        openBraceCount++;
        break;
      case TokenType.CLOSE_BRACE:
        openBraceCount--;
        if (openBraceCount < 1) {
          return lexer.string.slice(startIndex, lexer.index - 1);
        }
        break;
      case TokenType.COMMENT:
        state = 'inline comment';
        break;
      case TokenType.OPEN_BLOCK_COMMENT:
        state = 'block comment';
        break;
      case TokenType.BACKTICK:
        state = 'template literal';
        break;
      case TokenType.SINGLE_QUOTE:
        state = 'single-quote string';
        break;
      case TokenType.DOUBLE_QUOTE:
        state = 'double-quote string';
        break;
      case TokenType.SLASH:
        state = 'regexp literal';
        break;
      default:
        // pass over..
      }
      break;
    default:
      throw new Error(`Invalid state: ${state}`);
    }
  }
  throw new BMLSyntaxError('could not find end of `eval` block',
                           lexer.string, startIndex);
}


function createMatcher(string, isRegex) {
  if (isRegex) {
    return new RegExp(string, 'y');
  } else {
    return new RegExp(escapeRegExp(string), 'y');
  }
}

/**
 * @returns {[RegExp]}
 */
function parseMatchers(lexer) {
  let startIndex = lexer.index;
  let token;
  let afterLetterR = false;
  let acceptMatcher = true;
  let inComment = false;
  let matchers = [];
  while ((token = lexer.peek()) !== null) {
    if (inComment) {
      if (token.tokenType === TokenType.NEW_LINE) {
        inComment = false;
      }
    } else if (afterLetterR && !(token.tokenType === TokenType.SINGLE_QUOTE ||
                            token.tokenType === TokenType.DOUBLE_QUOTE)) {
      throw new BMLSyntaxError('regex matcher signifier (\'r\') not '
                               + 'immediately preceding string literal',
                               lexer.string, startIndex);
    } else {
      switch (token.tokenType) {
      case TokenType.WHITESPACE:
      case TokenType.NEW_LINE:
        break;
      case TokenType.COMMENT:
        inComment = true;
        break;
      case TokenType.KW_AS:
        return matchers;
      case TokenType.SINGLE_QUOTE:
      case TokenType.DOUBLE_QUOTE:
        if (acceptMatcher) {
          matchers.push(createMatcher(parseStringLiteralWithLexer(lexer),
                                      afterLetterR));
          afterLetterR = false;
          acceptMatcher = false;
          // break out of loop since the string literal token
          // stream has already been consumed.
          continue;
        } else {
          throw new BMLSyntaxError('unexpected string literal.',
                                   lexer.string, token.index);
        }
        break;
      case TokenType.COMMA:
        acceptMatcher = true;
        break;
      case TokenType.LETTER_R:
        if (afterLetterR) {
          throw new BMLSyntaxError('Cannot have two consecutive LETTER_R tokens.',
                                   lexer.string, token.index);
        }
        afterLetterR = true;
        break;
      default:
        throw new BMLSyntaxError(`Unexpected token ${token}`,
                                 lexer.string, token.index);
      }
    }
    // If we haven't broken out or thrown an error by now, consume this token.
    lexer.next();
  }
  throw new BMLSyntaxError('Could not find end of matcher.',
                           lexer.string, startIndex);
}

function parseCall(lexer) {
  let callRe = /call\s+([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)/y;
  callRe.lastIndex = lexer.index;
  let callMatch = callRe.exec(lexer.string);
  if (callMatch === null) {
    throw new BMLSyntaxError('invalid call statement',
                             lexer.string, lexer.index);
  }
  lexer.overrideIndex(lexer.index + callMatch[0].length);
  return new EvalBlock(callMatch[1]);
}

function parseReplacements(lexer) {
  let startIndex = lexer.index;
  let token;
  let inComment = false;
  let choices = [];
  let acceptReplacement = true;
  let acceptWeight = false;
  let acceptComma = false;
  let acceptReplacerEnd = false;

  while ((token = lexer.peek()) !== null) {
    if (inComment) {
      if (token.tokenType === TokenType.NEW_LINE) {
        inComment = false;
      }
    } else {
      switch (token.tokenType) {
      case TokenType.WHITESPACE:
      case TokenType.NEW_LINE:
        break;
      case TokenType.COMMENT:
        inComment = true;
        break;
      case TokenType.SINGLE_QUOTE:
      case TokenType.DOUBLE_QUOTE:
        if (acceptReplacement) {
          acceptReplacement = false;
          acceptWeight = true;
          acceptComma = true;
          acceptReplacerEnd = true;
          choices.push(new WeightedChoice(
            parseStringLiteralWithLexer(lexer), null));
          // break out of loop since the string literal token
          // stream is consumed by parseStringLiteralWithLexer
          continue;
        } else if (acceptReplacerEnd) {
          return choices;
        } else {
          throw new BMLSyntaxError('unexpected string literal',
                                   lexer.string, token.index);
        }
      case TokenType.CLOSE_BRACE:
      case TokenType.LETTER_R:
        if (acceptReplacerEnd) {
          return choices;
        } else {
          throw new BMLSyntaxError(
            `unexpected end of replacer: ${token.tokenType}`,
            lexer.string, token.index);
        }
      case TokenType.KW_CALL:
        if (acceptReplacement) {
          acceptReplacement = false;
          acceptWeight = true;
          acceptComma = true;
          acceptReplacerEnd = true;
          choices.push(new WeightedChoice(parseCall(lexer), null));
        } else {
          throw new BMLSyntaxError('unexpected call statement.',
                                   lexer.string, token.index);
        }
        continue;
      case TokenType.NUMBER:
        if (acceptWeight) {
          acceptWeight = false;
          acceptComma = true;
          acceptReplacerEnd = true;
          choices[choices.length - 1].weight = Number(token.string);
        } else {
          throw new BMLSyntaxError('unexpected number literal.',
                                   lexer.string, token.index);
        }
        break;
      case TokenType.COMMA:
        if (acceptComma) {
          acceptComma = false;
          acceptReplacement = true;
          acceptWeight = false;
          acceptReplacerEnd = false;
        } else {
          throw new BMLSyntaxError('unexpected comma.',
                                   lexer.string, token.index);
        }
        break;
      default:
        throw new BMLSyntaxError(`Unexpected token ${token}`,
                                 lexer.string, token.index);
      }
    }
    // If we haven't broken out or thrown an error by now, consume this token.
    lexer.next();
  }
  throw new BMLSyntaxError('Could not find end of replacer.',
                           lexer.string, startIndex);
}


function parseRule(lexer) {
  let matchers = parseMatchers(lexer);
  if (lexer.peek().tokenType !== TokenType.KW_AS) {
    throw new BMLSyntaxError('matchers must be followed with keyword "as"',
                             lexer.string, lexer.index);
  }
  lexer.next();  // consume KW_AS
  let replacements = parseReplacements(lexer);
  return createRule(matchers, replacements);
}

function parseMode(lexer) {
  let startIndex = lexer.index;
  if (lexer.peek().tokenType !== TokenType.KW_MODE) {
    throw new BMLSyntaxError('modes must begin with keyword "mode"',
                             lexer.string, lexer.index);
  }
  let token = lexer.next();  // consume KW_MODE
  let modeNameRe = /(\s*(\w+)\s*)/y;
  modeNameRe.lastIndex = lexer.index;
  let modeNameMatch = modeNameRe.exec(lexer.string);
  let mode = new Mode(modeNameMatch[2]);
  lexer.overrideIndex(lexer.index + modeNameMatch[1].length);

  if (lexer.peek().tokenType !== TokenType.OPEN_BRACE) {
    throw new BMLSyntaxError('modes must be opened with a curly brace ("{")',
                             lexer.string, lexer.index);
  }
  lexer.next();  // consume open brace

  let inComment = false;
  while ((token = lexer.peek()) !== null) {
    if (inComment) {
      if (token.tokenType === TokenType.NEW_LINE) {
        inComment = false;
      }
    } else {
      switch (token.tokenType) {
      case TokenType.WHITESPACE:
      case TokenType.NEW_LINE:
        break;
      case TokenType.COMMENT:
        inComment = true;
        break;
      case TokenType.SINGLE_QUOTE:
      case TokenType.DOUBLE_QUOTE:
      case TokenType.LETTER_R:
        mode.rules.push(parseRule(lexer));
        continue;
      case TokenType.CLOSE_BRACE:
        // consume closing brace
        lexer.next();
        return mode;
      default:
        throw new BMLSyntaxError(`Unexpected token ${token}`,
                                 lexer.string, token.index);
      }
    }
    // Accept and consume the token
    lexer.next();
  }
  throw new BMLSyntaxError('Could not find end of mode',
                           lexer.string, startIndex);
}


function parsePrelude(string) {
  let lexer = new Lexer(string);
  let inComment = false;
  let evalString = '';
  let modes = {};
  let token;
  while ((token = lexer.peek()) !== null) {
    if (inComment) {
      if (token.tokenType === TokenType.NEW_LINE) {
        inComment = false;
      }
    } else {
      switch (token.tokenType) {
      case TokenType.WHITESPACE:
      case TokenType.NEW_LINE:
        break;
      case TokenType.COMMENT:
        inComment = true;
        break;
      case TokenType.KW_EVAL:
        evalString += parseEval(lexer) + '\n';
        continue;
      case TokenType.KW_MODE:
        var newMode = parseMode(lexer);
        modes[newMode.name] = newMode;
        continue;
      case TokenType.KW_BEGIN:
        var beginStatementStartIndex = lexer.index;
        var initialModeName = parseBegin(lexer);
        var initialMode;
        if (modes.hasOwnProperty(initialModeName)) {
          initialMode = modes[initialModeName];
        } else if (initialModeName === null) {
          initialMode = null;
        } else if (initialModeName !== null) {
          throw new UnknownModeError(lexer.string,
                                     beginStatementStartIndex,
                                     initialModeName);
        }
        return {
          preludeEndIndex: lexer.index,
          evalBlock: new EvalBlock(evalString),
          modes: modes,
          initialMode: initialMode,
        };
      }
    }
    lexer.next();
  }
  // Could not find end of prelude; assume that none exists
  return {
    preludeEndIndex: 0,
    evalBlock: new EvalBlock(''),
    modes: {},
    initialMode: null,
  };
}

/**
 * Parse a `use` block of the form `{{use|using modeName}}`
 *
 * @returns {blockEndIndex, modeName} The returned index is the index immediately
 * after the closing brace.
 */
function parseUse(string, openBraceIndex) {
  let useRe = /{{(use|using)\s+(\w[\w\d]*)\s*}}/y;
  useRe.lastIndex = openBraceIndex;
  let match = useRe.exec(string);
  if (match === null) {
    throw new UnknownTransformError(string, openBraceIndex);
  }
  return {
    blockEndIndex: useRe.lastIndex,
    modeName: match[2]
  };
}

function parseBegin(lexer) {
  if (lexer.peek().tokenType !== TokenType.KW_BEGIN) {
    throw new BMLSyntaxError('begin statements must start with keyword "begin"',
                             lexer.string, lexer.index);
  }
  let token = lexer.next();
  let useRe = /\s+(use|using)\s+(\w[\w\d]*)/y;
  useRe.lastIndex = lexer.index;
  let match = useRe.exec(lexer.string);
  if (match !== null) {
    lexer.overrideIndex(lexer.index + match[0].length);
    return match[2];
  } else {
    return match;
  }
}

/**
 * @param lexer {Lexer} a lexer whose next token is either TokenType.SINGLE_QUOTE
 * or TokenType.DOUBLE_QUOTE.
 *
 * @return {String} the parsed string literal.
 */
function parseStringLiteralWithLexer(lexer) {
  let startIndex = lexer.index;
  let stringLiteral = '';
  let token;
  let openStringToken = lexer.next();
  while ((token = lexer.next()) !== null) {
    if (token.tokenType === openStringToken.tokenType) {
      return stringLiteral;
    }
    stringLiteral += token.string;
  }
  throw new BMLSyntaxError('Could not find end of string.',
                           lexer.string, startIndex);
}

// TODO: use me in similar logic in other parsers
// {closeQuoteIndex, extractedString}
function parseStringLiteral(string, openQuoteIndex) {
  let index = openQuoteIndex + 1;
  let isEscaped = false;
  while (index < string.length) {
    if (isEscaped) {
      isEscaped = false;
    } else {
      if (string[index] === '\\') {
        isEscaped = true;
      } else if (string[index] === '\'') {
        return {
          closeQuoteIndex: index,
          extractedString: string.slice(openQuoteIndex + 1, index),
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
  let numberRe = /(\d+(\.\d+)?)|(\.\d+)/y;
  numberRe.lastIndex = numberIndex;
  let match = numberRe.exec(string);
  if (match === null) {
    return null;
  }
  return {
    lastDigitIndex: numberIndex + match[0].length,
    extractedNumber: Number(match[0]),
  };
}

function parseInlineChoose(string, openBraceIndex) {
  let lexer = new Lexer(string);
  lexer.overrideIndex(openBraceIndex + 2);
  let replacements = parseReplacements(lexer);
  return {
    blockEndIndex: lexer.index + 2,
    replacer: createWeightedOptionReplacer(replacements, false),
  };
}

exports.parseEval = parseEval;
exports.parseRule = parseRule;
exports.parseMode = parseMode;
exports.parsePrelude = parsePrelude;
exports.parseUse = parseUse;
exports.parseStringLiteral = parseStringLiteral;
exports.parseStringLiteralWithLexer = parseStringLiteralWithLexer;
exports.parseInlineChoose = parseInlineChoose;
exports.createMatcher = createMatcher;
exports.parseMatchers = parseMatchers;
exports.parseCall = parseCall;
exports.parseReplacements = parseReplacements;
