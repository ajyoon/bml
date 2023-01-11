import { EvalBlock } from './evalBlock';
import { FunctionCall } from './functionCall';
import { WeightedChoice, Choice } from './weightedChoice';
import { Lexer } from './lexer';
import { TokenType } from './tokenType';
import { Replacer } from './replacer';
import { BackReference } from './backReference';
import {
  IllegalStateError,
  JavascriptSyntaxError,
  BMLSyntaxError,
  BMLDuplicatedRefIndexError,
} from './errors';


/**
 * Parse an `eval` block
 *
 * @param lexer - A lexer whose next token is OPEN_BRACKET. This will be
 *     mutated in place such that when the method returns, the lexer's
 *     next token will be after the closing bracket of the block.
 *
 * @return The string of Javascript code extracted from the eval block
 *
 * @throws {JavascriptSyntaxError} If the javascript snippet inside the eval
 *     block contains a syntax error which makes parsing it impossible.
 */
export function parseEval(lexer: Lexer): string {
  if (lexer.next()?.tokenType !== TokenType.OPEN_BRACKET) {
    throw new IllegalStateError('parseEval started with non-OPEN_BRACKET');
  }

  let state = 'code';
  let index = lexer.index;
  let startIndex = index;
  let openBracketCount = 1;
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
          throw new JavascriptSyntaxError(lexer.str, lexer.index);
        }
        break;
      case 'double-quote string':
        if (token.tokenType === TokenType.DOUBLE_QUOTE) {
          state = 'code';
        } else if (token.tokenType === TokenType.NEW_LINE) {
          throw new JavascriptSyntaxError(lexer.str, lexer.index);
        }
        break;
      case 'regexp literal':
        if (token.tokenType === TokenType.SLASH) {
          state = 'code';
        }
        break;
      case 'code':
        switch (token.tokenType) {
          case TokenType.OPEN_BRACKET:
            openBracketCount++;
            break;
          case TokenType.CLOSE_BRACKET:
            openBracketCount--;
            if (openBracketCount < 1) {
              return lexer.str.slice(startIndex, lexer.index - 1);
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
  throw new JavascriptSyntaxError('could not find end of javascript code block',
    startIndex);
}


// Expects the lexer's current token immediately follows the
// replacement list open braace.
export function parseReplacements(lexer: Lexer): Replacer {
  let startIndex = lexer.index;
  let token;
  let choices = [];
  let acceptReplacement = true;
  let acceptWeight = false;
  let acceptComma = false;
  let acceptReplacerEnd = false;

  // I think this will fail if there is a linebreak or
  // comments after open brace but before identifier
  let identifier = null;
  let isSilent = false;
  let identifierRe = /\s*(#?)(\w+):/y;
  identifierRe.lastIndex = lexer.index;
  let identifierMatch = identifierRe.exec(lexer.str);
  if (identifierMatch) {
    identifier = identifierMatch[2];
    if (identifierMatch[1]) {
      isSilent = true;
    }
    lexer.overrideIndex(lexer.index + identifierMatch[0].length);
  }

  while ((token = lexer.peek()) !== null) {
    switch (token.tokenType) {
      case TokenType.WHITESPACE:
      case TokenType.NEW_LINE:
        break;
      case TokenType.OPEN_PAREN:
      case TokenType.CLOSE_BRACE:
        if (acceptReplacerEnd) {
          lexer.next(); // Consume close brace
          return new Replacer(choices, identifier, isSilent);
        } else {
          throw new BMLSyntaxError(
            `unexpected end of replacer: ${token.tokenType}`,
            lexer.str, token.index);
        }
      case TokenType.OPEN_BRACKET:
        if (acceptReplacement) {
          acceptReplacement = false;
          acceptWeight = true;
          acceptComma = true;
          acceptReplacerEnd = true;
          // TODO make WeightedChoice support `EvalBlock`s.
          // Need to merge the functionality of `FunctionCall` with it.
          let evalBlock = parseEval(lexer);
          choices.push(new WeightedChoice(evalBlock, null));
        } else {
          throw new BMLSyntaxError('unexpected call statement.',
            lexer.str, token.index);
        }
        continue;
      case TokenType.NUMBER:
        if (acceptWeight) {
          acceptWeight = false;
          acceptComma = true;
          acceptReplacerEnd = true;
          choices[choices.length - 1].weight = Number(token.str);
        } else {
          throw new BMLSyntaxError('unexpected number literal.',
            lexer.str, token.index);
        }
        break;
      case TokenType.COMMA:
        if (acceptComma) {
          acceptComma = false;
          acceptReplacement = true;
          acceptWeight = false;
          acceptReplacerEnd = true;
        } else {
          throw new BMLSyntaxError('unexpected comma.',
            lexer.str, token.index);
        }
        break;
      default:
        throw new BMLSyntaxError(`Unexpected token ${token}`,
          lexer.str, token.index);
    }

    // If we haven't broken out or thrown an error by now, consume this token.
    lexer.next();
  }
  throw new BMLSyntaxError('Could not find end of replacer.',
    lexer.str, startIndex);
}


/**
 * @param lexer a lexer whose next token is TokenType.OPEN_PAREN
 *
 * @return the parsed string literal replacement body
 */
export function parseReplacementWithLexer(lexer: Lexer): string {
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
    stringLiteral += token.str;
  }
  throw new BMLSyntaxError('Could not find end of replacement.',
    lexer.str, startIndex);
}

type ParseInlineCommandResult = {
  blockEndIndex: number,
  backReference: BackReference | null,
  replacer: Replacer | null
}

// TODO turns out actually this name doesnt fully make sense.
// the renderer uses an ahead-of-time regex before going into parsing
// since it will parse a 'use' command differently from replacers/backrefs.
// maybe refactor to combine these into one brace-command parser here?
export function parseInlineCommand(str: string, openBraceIndex: number): ParseInlineCommandResult {
  let lexer = new Lexer(str);
  lexer.overrideIndex(openBraceIndex + 1);
  let backReference = parseBackReference(lexer);
  let replacer = null;
  if (backReference == null) {
    replacer = parseReplacements(lexer, false);
  }
  return {
    blockEndIndex: lexer.index,
    backReference: backReference,
    replacer: replacer,
  };
}

// Returns null if there is no backref slug at the beginning of the block
export function parseBackReference(lexer: Lexer): BackReference | null {
  let startIndex = lexer.index;

  // TODO I think this doesn't work if there's a comment or linebreak
  // after the opening brace but before the identifier slug
  let referredIdentifierRe = /\s*@(\w+)/y;
  referredIdentifierRe.lastIndex = lexer.index;
  let referredIdentifierMatch = referredIdentifierRe.exec(lexer.str);
  if (!referredIdentifierMatch) {
    return null;
  }
  let referredIdentifier = referredIdentifierMatch[1];
  lexer.overrideIndex(lexer.index + referredIdentifierMatch[0].length);

  let choiceMap = new Map();
  let fallback: Choice | null = null;

  let acceptColon = true;
  let acceptChoiceIndex = false;
  let acceptArrow = false;
  let acceptReplacement = false;
  let acceptComma = false;
  let acceptBlockEnd = true;

  let currentChoiceIndexes = [];
  let currentReplacement = null;
  let token;

  while ((token = lexer.peek()) !== null) {
    switch (token.tokenType) {
      case TokenType.WHITESPACE:
      case TokenType.NEW_LINE:
        break;
      case TokenType.COLON:
        if (acceptColon) {
          acceptColon = false;
          acceptChoiceIndex = true;
          acceptBlockEnd = false;
        } else {
          throw new BMLSyntaxError('Unexpected colon in back reference block',
            lexer.str, token.index);
        }
        break;
      case TokenType.NUMBER:
        if (acceptChoiceIndex) {
          acceptChoiceIndex = false;
          acceptArrow = true;
          acceptComma = true;
          currentChoiceIndexes.push(Number(token.str));
        } else {
          throw new BMLSyntaxError('Unexpected number in back reference block',
            lexer.str, token.index);
        }
        break;
      case TokenType.ARROW:
        if (acceptArrow) {
          acceptArrow = false;
          acceptReplacement = true;
          acceptComma = false;
        } else {
          throw new BMLSyntaxError('Unexpected arrow in back reference block',
            lexer.str, token.index);
        }
        break;
      case TokenType.OPEN_PAREN:
      case TokenType.OPEN_BRACKET:
        if (acceptReplacement) {
          if (token.tokenType === TokenType.OPEN_PAREN) {
            currentReplacement = parseReplacementWithLexer(lexer);
          } else {
            currentReplacement = parseEval(lexer);
          }
          if (currentChoiceIndexes.length) {
            for (let choiceIndex of currentChoiceIndexes) {
              if (choiceMap.has(choiceIndex)) {
                // it's not ideal to validate this here, but with the way it's currently
                // built, if we don't it will just silently overwrite the key
                throw new BMLDuplicatedRefIndexError(
                  referredIdentifier, choiceIndex, lexer.str, token.index);
              }
              choiceMap.set(choiceIndex, currentReplacement);
            }
            // Reset state for next choice
            acceptReplacement = false;
            acceptComma = true;
            acceptBlockEnd = true;
            currentChoiceIndexes = [];
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
            lexer.str, token.index);
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
            lexer.str, token.index);
        }
        break;
      case TokenType.CLOSE_BRACE:
        if (acceptBlockEnd) {
          lexer.next();  // consume close brace
          return new BackReference(referredIdentifier, choiceMap, fallback);
        } else {
          throw new BMLSyntaxError('Unexpected close brace in back reference block',
            lexer.str, token.index);
        }
      default:
        throw new BMLSyntaxError(`Unexpected token ${token}`,
          lexer.str, token.index);
    }
    // If we haven't broken out or thrown an error by now, consume this token.
    lexer.next();
  }
  throw new BMLSyntaxError('Could not find end of back reference block.',
    lexer.str, startIndex);
}

