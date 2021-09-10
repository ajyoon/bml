const _rand = require('./rand.js');
const _errors = require('./errors.js');
const _stringUtils = require('./stringUtils.js');
const EvalBlock = require('./evalBlock.js').EvalBlock;
const Mode = require('./mode.js').Mode;
const WeightedChoice = require('./weightedChoice.js').WeightedChoice;
const Lexer = require('./lexer.js').Lexer;
const TokenType = require('./tokenType.js').TokenType;
const Rule = require('./rule.js').Rule;
const Replacer = require('./replacer').Replacer;
const BackReference = require('./backReference.js').BackReference;

const UnknownTransformError = _errors.UnknownTransformError;
const UnknownModeError = _errors.UnknownModeError;
const JavascriptSyntaxError = _errors.JavascriptSyntaxError;
const BMLSyntaxError = _errors.BMLSyntaxError;
const BMLDuplicatedRefIndexError = _errors.BMLDuplicatedRefIndexError;
const escapeRegExp = _stringUtils.escapeRegExp;


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
    } else if (afterLetterR && token.tokenType !== TokenType.OPEN_PAREN) {
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
      case TokenType.OPEN_PAREN:
        if (acceptMatcher) {
          matchers.push(createMatcher(parseReplacementWithLexer(lexer),
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

function parseReplacements(lexer, forRule) {
  let startIndex = lexer.index;
  let token;
  let inComment = false;
  let choices = [];
  let acceptReplacement = true;
  let acceptWeight = false;
  let acceptComma = false;
  let acceptReplacerEnd = false;
  
  // I think this will fail if there is a linebreak or
  // comments after open brace but before identifier
  let identifier = null;
  let identifierRe = /\s*(\w+):/y;
  identifierRe.lastIndex = lexer.index;
  let identifierMatch = identifierRe.exec(lexer.string);
  if (identifierMatch) {
    if (forRule) {
      throw new BMLSyntaxError('Choice identifiers are not allowed in rules',
                               lexer.string, lexer.index);
    }
    identifier = identifierMatch[1];
    lexer.overrideIndex(lexer.index + identifierMatch[0].length);
  }

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
      case TokenType.OPEN_PAREN:
        if (acceptReplacement) {
          acceptReplacement = false;
          acceptWeight = true;
          acceptComma = true;
          acceptReplacerEnd = true;
          choices.push(new WeightedChoice(
            parseReplacementWithLexer(lexer), null));
          continue;
        } else if (acceptReplacerEnd) {
          return new Replacer(choices, forRule, identifier);
        } else {
          throw new BMLSyntaxError('unexpected open paren',
                                   lexer.string, token.index);
        }
        break;
      case TokenType.CLOSE_BRACE:
      case TokenType.LETTER_R:
        if (acceptReplacerEnd) {
          return new Replacer(choices, forRule, identifier);
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
  let replacements = parseReplacements(lexer, true);
  return new Rule(matchers, replacements);
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
      case TokenType.OPEN_PAREN:
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
      default:
        return {
          preludeEndIndex: lexer.index,
          evalBlock: new EvalBlock(evalString),
          modes: modes,
        };
      }
    }
    lexer.next();
  }
  // The prelude never ended in the document
  return {
    preludeEndIndex: lexer.index,
    evalBlock: new EvalBlock(evalString),
    modes: modes,
  };
}

/**
 * Parse a `use` block of the form `{use|using modeName}`
 *
 * @returns {blockEndIndex, modeName} The returned index is the index immediately
 * after the closing brace.
 */
function parseUse(string, openBraceIndex) {
  let useRe = /{(use|using)\s+(\w[\w\d]*)\s*}/y;
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

/**
 * @param lexer {Lexer} a lexer whose next token is TokenType.OPEN_PAREN
 *
 * @return {String} the parsed string literal replacement body
 */
function parseReplacementWithLexer(lexer) {
  lexer.next();
  let startIndex = lexer.index;
  let stringLiteral = '';
  let token;
  let openParenCount = 1;
  while ((token = lexer.next()) !== null) {
    switch (token.tokenType) {
    case TokenType.OPEN_PAREN:
      openParenCount++;
      break;
    case TokenType.CLOSE_PAREN:
      openParenCount--;
      if (openParenCount < 1) {
        return stringLiteral;
      }
      break;
    }
    stringLiteral += token.string;
  }
  throw new BMLSyntaxError('Could not find end of replacement.',
                           lexer.string, startIndex);
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

// TODO turns out actually this name doesnt fully make sense.
// the renderer uses an ahead-of-time regex before going into parsing
// since it will parse a 'use' command differently from replacers/backrefs.
// maybe refactor to combine these into one brace-command parser here?
function parseInlineCommand(string, openBraceIndex) {
  let lexer = new Lexer(string);
  lexer.overrideIndex(openBraceIndex + 1);
  let backReference = parseBackReference(lexer);
  let replacements = null;
  if (backReference == null) {
    replacements = parseReplacements(lexer, false);
  }
  return {
    blockEndIndex: lexer.index + 1,
    backReference: backReference,
    replacer: replacements,
  };
}

// Returns null if there is no backref slug at the beginning of the block
function parseBackReference(lexer) {
  let startIndex = lexer.index;

  // TODO I think this doesn't work if there's a comment or linebreak
  // after the opening brace but before the identifier slug
  let referredIdentifierRe = /\s*@(\w+)/y;
  referredIdentifierRe.lastIndex = lexer.index;
  let referredIdentifierMatch = referredIdentifierRe.exec(lexer.string);
  if (!referredIdentifierMatch) {
    return null;
  }
  let referredIdentifier = referredIdentifierMatch[1];
  lexer.overrideIndex(lexer.index + referredIdentifierMatch[0].length);
  
  let choiceMap = new Map();
  let fallback = null;

  let acceptColon = true;
  let acceptChoiceIndex = false;
  let acceptArrow = false;
  let acceptReplacement = false;
  let acceptComma = false;
  let acceptBlockEnd = true;
  let inComment = false;

  let currentChoiceIndex = null;
  let currentReplacement = null;
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
      case TokenType.COLON:
        if (acceptColon) {
          acceptColon = false;
          acceptChoiceIndex = true;
          acceptBlockEnd = false;
        } else {
          throw new BMLSyntaxError('Unexpected colon in back reference block',
                                   lexer.string, token.index);
        }
        break;
      case TokenType.NUMBER:
        if (acceptChoiceIndex) {
          acceptChoiceIndex = false;
          acceptArrow = true;
          currentChoiceIndex = Number(token.string);
        } else {
          throw new BMLSyntaxError('Unexpected number in back reference block',
                                   lexer.string, token.index);
        }
        break;
      case TokenType.ARROW:
        if (acceptArrow) {
          acceptArrow = false;
          acceptReplacement = true;
        } else {
          throw new BMLSyntaxError('Unexpected arrow in back reference block', 
                                   lexer.string, token.index);
        }
        break;
      case TokenType.OPEN_PAREN:
      case TokenType.KW_CALL:
        if (acceptReplacement) {
          if (token.tokenType === TokenType.OPEN_PAREN) {
            currentReplacement = parseReplacementWithLexer(lexer);
          } else {
            currentReplacement = parseCall(lexer);
          }
          if (currentChoiceIndex != null) {
            if (choiceMap.has(currentChoiceIndex)) {
              // it's not ideal to validate this here, but with the way it's currently
              // built, if we don't it will just silently overwrite the key
              throw new BMLDuplicatedRefIndexError(
                referredIdentifier, currentChoiceIndex, lexer.string, token.index);
            }
            choiceMap.set(currentChoiceIndex, currentReplacement);
            // Reset state for next choice
            acceptReplacement = false;
            acceptComma = true;
            acceptBlockEnd = true;
            currentChoiceIndex = null;
            currentReplacement = null;
          } else {
            // Since there is no current choice index, this must be a fallback choice
            fallback = currentReplacement;
            // Set state so the block must end here.
            acceptReplacement = false;
            acceptComma = false;
            acceptBlockEnd = true;
          }
        } else {
          throw new BMLSyntaxError('Unexpected replacement in back reference block', 
                                   lexer.string, token.index);
        }
        continue;
      case TokenType.COMMA:
        if (acceptComma) {
          acceptComma = false;
          acceptChoiceIndex = true;
          // Replacements can directly follow commas if they are fallbacks
          acceptReplacement = true;
        } else {
          throw new BMLSyntaxError('Unexpected comma in back reference block', 
                                   lexer.string, token.index);
        }
        break;
      case TokenType.CLOSE_BRACE:
        if (acceptBlockEnd) {
          return new BackReference(referredIdentifier, choiceMap, fallback);
        } else {
          throw new BMLSyntaxError('Unexpected close brace in back reference block', 
                                   lexer.string, token.index);
        }
      default:
        throw new BMLSyntaxError(`Unexpected token ${token}`,
                                 lexer.string, token.index);
      }
    }
    // If we haven't broken out or thrown an error by now, consume this token.
    lexer.next();
  }
  throw new BMLSyntaxError('Could not find end of back reference block.',
                           lexer.string, startIndex);
}

exports.parseEval = parseEval;
exports.parseRule = parseRule;
exports.parseMode = parseMode;
exports.parsePrelude = parsePrelude;
exports.parseUse = parseUse;
exports.parseInlineCommand = parseInlineCommand;
exports.createMatcher = createMatcher;
exports.parseMatchers = parseMatchers;
exports.parseCall = parseCall;
exports.parseReplacements = parseReplacements;
exports.parseBackReference = parseBackReference;
