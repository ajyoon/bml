import { EvalBlock } from './evalBlock';
import { WeightedChoice } from './weightedChoice';
import { Lexer } from './lexer';
import { TokenType } from './tokenType';
import { ChoiceFork } from './choiceFork';
import { Reference } from './reference';
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
export function parseFork(lexer: Lexer): ChoiceFork | Reference {
  let startIndex = lexer.index;

  let mappedChoices = new Map();
  let unmappedChoices: WeightedChoice[] = [];

  // Big blob in 2nd capture is for identifiers inclusive of non-ascii chars
  // It's an approximation of JS identifiers.
  let idRe = /(@|#|@!|\$|#\$|)([_a-zA-Z\xA0-\uFFFF][_a-zA-Z0-9\xA0-\uFFFF]*)(:?)/y;

  let id = null;
  let isReference = false;
  let isSilent = false;
  let isReExecuting = false;
  let isSet = false;

  let acceptId = true;
  let acceptWeight = false;
  let acceptChoiceIndex = false;
  let acceptArrow = false;
  let acceptReplacement = true;
  let acceptComma = false;
  let acceptBlockEnd = false;

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
          acceptBlockEnd = false;
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
      case TokenType.OPEN_BRACE:
        if (acceptReplacement) {
          acceptChoiceIndex = false;
          if (token.tokenType === TokenType.OPEN_PAREN) {
            lexer.next();
            currentReplacement = parseDocument(lexer, false);
          } else if (token.tokenType === TokenType.OPEN_BRACKET) {
            currentReplacement = parseEval(lexer);
          } else {
            lexer.next();
            currentReplacement = [parseFork(lexer)];
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
          if (isReference) {
            return new Reference(id!, mappedChoices, unmappedChoices, isReExecuting);
          } else {
            return new ChoiceFork(unmappedChoices, id, isSilent, isSet)
          }
        } else {
          if (!mappedChoices.size && !unmappedChoices.length) {
            // Special case for a common mistake
            if (id) {
              throw new BMLSyntaxError(`Fork '${id}' has no branches`,
                lexer.str, token.index, `Did you mean '{@${id}}'?`);
            } else {
              throw new BMLSyntaxError('Fork has no branches',
                lexer.str, token.index);
            }
          }
          throw new BMLSyntaxError('Unexpected close brace in fork',
            lexer.str, token.index);
        }
      case TokenType.AT:
      case TokenType.HASH:
      case TokenType.DOLLAR:
      case TokenType.TEXT:
        if (acceptId) {
          idRe.lastIndex = lexer.index;
          let idMatch = idRe.exec(lexer.str);
          if (!idMatch) {
            throw new BMLSyntaxError(`Unexpected token ${token}`,
              lexer.str, token.index);
          }
          let typeSlug = idMatch[1];
          id = idMatch[2];
          let includesColon = !!idMatch[3];
          if (typeSlug == '@') {
            isReference = true;
            if (includesColon) {
              acceptChoiceIndex = true;
            } else {
              acceptBlockEnd = true;
            }
          } else if (typeSlug == '#') {
            isSilent = true;
          } else if (typeSlug == '@!') {
            isReference = true;
            isReExecuting = true;
            if (includesColon) {
              throw new BMLSyntaxError(`Re-executing reference '${id}' should not have a colon, `
                + 'since re-executing references cannot have mappings.',
                lexer.str, token.index, `Did you mean '{@!${id}}'?`)
            } else {
              acceptBlockEnd = true;
            }
          } else if (typeSlug == '$') {
            isSet = true;
          } else if (typeSlug == '#$') {
            isSet = true;
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

  function pushString(str: string) {
    // To keep the AST more compact, sequential string nodes are joined together.
    if (!astNodes.length) {
      astNodes.push(str);
      return;
    }
    let lastNode = astNodes[astNodes.length - 1];
    if (isStr(lastNode)) {
      astNodes[astNodes.length - 1] = lastNode.concat(str);
    } else {
      astNodes.push(str);
    }
  }

  while ((token = lexer.next()) !== null) {
    switch (token.tokenType) {
      case TokenType.OPEN_PAREN:
        openParenCount++;
        pushString(token.str);
        break;
      case TokenType.CLOSE_PAREN:
        openParenCount--;
        if (openParenCount < 1) {
          return astNodes;
        } else {
          pushString(token.str);
        }
        break;
      case TokenType.OPEN_BRACKET:
        if (lexer.peek()?.tokenType == TokenType.OPEN_BRACKET) {
          pushString(parseLiteralBlock(lexer));
        } else {
          pushString(token.str);
        }
        break;
      case TokenType.OPEN_BRACE:
        let fork = parseFork(lexer);
        astNodes = astNodes.concat(fork);
        break;
      default:
        // Any other input is treated as a string
        pushString(token.str);
    }
  }
  if (!isTopLevel) {
    throw new BMLSyntaxError(`Reached end of document while parsing string.`,
      lexer.str, startIndex)
  }
  return astNodes;
}
