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
import { AstNode } from './ast';
import { isStr } from './stringUtils';


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
export function parseEval(lexer: Lexer): EvalBlock {
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
              let source = lexer.str.slice(startIndex, lexer.index - 1);
              return new EvalBlock(source);
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

/**
 * The main function for parsing {} blocks.
 *
 * Expects the lexer's previous token to be the opening curly brace,
 * and the next token whatever comes next.
 */
export function parseFork(lexer: Lexer): Replacer | BackReference {
  let startIndex = lexer.index;

  let mappedChoices = new Map();
  let unmappedChoices: WeightedChoice[] = [];

  let idRe = /([@#]?)(\w+):?/y;

  let id = null;
  let isBackReference = false;
  let isSilent = false;

  let acceptId = true;
  let acceptWeight = false;
  let acceptChoiceIndex = false;
  let acceptArrow = false;
  let acceptReplacement = true;
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
      case TokenType.NUMBER:
        if (acceptChoiceIndex) {
          acceptChoiceIndex = false;
          acceptArrow = true;
          acceptComma = true;
          currentChoiceIndexes.push(Number(token.str));
        } else if (acceptWeight) {
          acceptWeight = false;
          acceptComma = true;
          acceptBlockEnd = true;
          unmappedChoices[unmappedChoices.length - 1].weight = Number(token.str);
        } else {
          throw new BMLSyntaxError('Unexpected number in fork',
            lexer.str, token.index);
        }
        break;
      case TokenType.ARROW:
        if (acceptArrow) {
          acceptArrow = false;
          acceptReplacement = true;
          acceptComma = false;
        } else {
          throw new BMLSyntaxError('Unexpected arrow in fork',
            lexer.str, token.index);
        }
        break;
      case TokenType.OPEN_PAREN:
      case TokenType.OPEN_BRACKET:
        if (acceptReplacement) {
          acceptChoiceIndex = false;
          if (token.tokenType === TokenType.OPEN_PAREN) {
            lexer.next();
            currentReplacement = parseDocument(lexer, false);
          } else {
            currentReplacement = parseEval(lexer);
          }
          if (currentChoiceIndexes.length) {
            for (let choiceIndex of currentChoiceIndexes) {
              if (mappedChoices.has(choiceIndex)) {
                // it's not ideal to validate this here, but with the way it's currently
                // built, if we don't it will just silently overwrite the key
                throw new BMLDuplicatedRefIndexError(
                  id!, choiceIndex, lexer.str, token.index);
              }
              mappedChoices.set(choiceIndex, currentReplacement);
            }
            // Reset state for next choice
            acceptReplacement = false;
            acceptComma = true;
            acceptBlockEnd = true;
            currentChoiceIndexes = [];
            currentReplacement = null;
          } else {
            // Since there is no current choice index, this must be an unmapped choice
            unmappedChoices.push(new WeightedChoice(currentReplacement, null));
            acceptReplacement = false;
            acceptComma = true;
            acceptWeight = true;
            acceptBlockEnd = true;
          }
        } else {
          throw new BMLSyntaxError('Unexpected replacement in fork',
            lexer.str, token.index);
        }
        continue;
      case TokenType.COMMA:
        if (acceptComma) {
          acceptComma = false;
          acceptChoiceIndex = true;
          if (!acceptArrow) {
            acceptReplacement = true;
          }
        } else {
          throw new BMLSyntaxError('Unexpected comma in fork',
            lexer.str, token.index);
        }
        break;
      case TokenType.CLOSE_BRACE:
        if (acceptBlockEnd) {
          lexer.next();  // consume close brace
          if (isBackReference) {
            return new BackReference(id!, mappedChoices, unmappedChoices);
          } else {
            return new Replacer(unmappedChoices, id, isSilent)
          }
        } else {
          throw new BMLSyntaxError('Unexpected close brace in fork',
            lexer.str, token.index);
        }
      case TokenType.TEXT:
      case TokenType.AT:
        if (acceptId) {
          idRe.lastIndex = lexer.index;
          let idMatch = idRe.exec(lexer.str);
          if (!idMatch) {
            throw new BMLSyntaxError(`Unexpected token ${token}`,
              lexer.str, token.index);
          }
          let typeSlug = idMatch[1];
          id = idMatch[2];
          if (typeSlug == '@') {
            isBackReference = true;
            acceptChoiceIndex = true;
          } else if (typeSlug == '#') {
            isSilent = true;
          }
          lexer.overrideIndex(lexer.index + idMatch[0].length);
          acceptId = false;
          continue;
        } else {
          throw new BMLSyntaxError(`Unexpected token ${token}`,
            lexer.str, token.index);
        }
      default:
        throw new BMLSyntaxError(`Unexpected token ${token}`,
          lexer.str, token.index);
    }
    // If we haven't broken out or thrown an error by now, consume this token.
    lexer.next();
  }
  throw new BMLSyntaxError('Could not find end of fork.',
    lexer.str, startIndex);
}


/**
 * Parse a literal block expressed with double-brackets
 *
 * Expects the lexer's next token to be the second opening bracket.
 * Upon returning, the lexer's next token is the one right after the final closing bracket.
 */
export function parseLiteralBlock(lexer: Lexer): string {
  let blockStartIndex = lexer.index - 1;
  if (lexer.next()?.tokenType !== TokenType.OPEN_BRACKET) {
    throw new IllegalStateError('parseLiteralBlock started with non-OPEN_BRACKET');
  }
  let token;
  let result = '';
  while ((token = lexer.next()) !== null) {
    switch (token.tokenType) {
      case TokenType.CLOSE_BRACKET:
        if (lexer.peek()?.tokenType == TokenType.CLOSE_BRACKET) {
          lexer.next();
          return result;
        }
      default:
        result += token.str;
    }
  }
  throw new BMLSyntaxError('Could not find end of literal block', lexer.str, blockStartIndex);
}

/**
 * The top-level (or recursively called) parsing function. Returns an AST.
 *
 * If being recursively called, isTopLevel should be false and the
 * lexer's previous token should be an OPEN_PAREN.
 */
export function parseDocument(lexer: Lexer, isTopLevel: boolean): AstNode[] {
  let startIndex = lexer.index;
  let token;
  let openParenCount = 1;
  let astNodes: AstNode[] = [];
  while ((token = lexer.next()) !== null) {
    switch (token.tokenType) {
      case TokenType.OPEN_PAREN:
        openParenCount++;
        break;
      case TokenType.CLOSE_PAREN:
        openParenCount--;
        if (openParenCount < 1) {
          return astNodes;
        }
        break;
      case TokenType.OPEN_BRACE:
        let fork = parseFork(lexer);
        astNodes = astNodes.concat(fork);
        break;
      default:
        // Any other input is treated as a string
        // To keep the AST more compact, sequential string nodes are joined together.
        if (astNodes.length) {
          let lastNode = astNodes[astNodes.length - 1];
          if (isStr(lastNode)) {
            astNodes[astNodes.length - 1] = lastNode.concat(token.str);
          } else {
            astNodes.push(token.str);
          }
        } else {
          astNodes.push(token.str);
        }
    }
  }
  if (!isTopLevel) {
    throw new BMLSyntaxError(`Reached end of document while parsing string.`,
      lexer.str, startIndex)
  }
  return astNodes;
}
