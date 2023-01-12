import { Token } from './token';
import { TokenType } from './tokenType';

const ANY_WHITESPACE_RE = /\s/;

export class Lexer {

  str: string;
  index: number;
  private _cachedNext: Token | null = null;
  private _newLineRe: RegExp = /\r?\n/y;
  private _visualNewLineRe: RegExp = /\\\r?\n/y;
  private _whitespaceRe: RegExp = /[^\S\r\n]+/y;  // non-newline whitespace
  private _numberRe: RegExp = /(\d+(\.\d+)?)|(\.\d+)/y;

  constructor(str: string) {
    this.str = str;
    this.index = 0;
  }

  /**
   * Set this.index and invalidate the next-token cache
   */
  overrideIndex(newIndex: number) {
    this._cachedNext = null;
    this.index = newIndex;
  }

  /**
   * Determine the next item in the token stream
   */
  _determineNextRaw(): Token | null {
    if (this.index >= this.str.length) {
      return null;
    }
    let tokenType;
    let tokenIndex = this.index;
    let tokenEndIndex = null;
    let tokenString;
    this._newLineRe.lastIndex = this.index;
    this._visualNewLineRe.lastIndex = this.index;
    this._whitespaceRe.lastIndex = this.index;
    this._numberRe.lastIndex = this.index;
    let newLineMatch = this._newLineRe.exec(this.str);
    let visualNewLineMatch = this._visualNewLineRe.exec(this.str);
    let whitespaceMatch = this._whitespaceRe.exec(this.str);
    let numberMatch = this._numberRe.exec(this.str);
    if (newLineMatch !== null) {
      tokenType = TokenType.NEW_LINE;
      tokenString = newLineMatch[0];
    } else if (visualNewLineMatch !== null) {
      tokenType = TokenType.VISUAL_NEW_LINE;
      tokenEndIndex = visualNewLineMatch.index + visualNewLineMatch[0].length;
      tokenString = '\\\n';
    } else if (whitespaceMatch !== null) {
      tokenType = TokenType.WHITESPACE;
      tokenString = whitespaceMatch[0];
    } else if (numberMatch !== null) {
      tokenType = TokenType.NUMBER;
      tokenString = numberMatch[0];
    } else if (this.str.slice(this.index, this.index + 2) === '//') {
      tokenType = TokenType.COMMENT;
      tokenString = '//';
    } else if (this.str.slice(this.index, this.index + 2) === '/*') {
      tokenType = TokenType.OPEN_BLOCK_COMMENT;
      tokenString = '/*';
    } else if (this.str.slice(this.index, this.index + 2) === '*/') {
      tokenType = TokenType.CLOSE_BLOCK_COMMENT;
      tokenString = '*/';
    } else if (this.str[this.index] === '/') {
      tokenType = TokenType.SLASH;
      tokenString = '/';
    } else if (this.str[this.index] === '\'') {
      tokenType = TokenType.SINGLE_QUOTE;
      tokenString = '\'';
    } else if (this.str[this.index] === '"') {
      tokenType = TokenType.DOUBLE_QUOTE;
      tokenString = '"';
    } else if (this.str[this.index] === '`') {
      tokenType = TokenType.BACKTICK;
      tokenString = '`';
    } else if (this.str[this.index] === '(') {
      tokenType = TokenType.OPEN_PAREN;
      tokenString = '(';
    } else if (this.str[this.index] === ')') {
      tokenType = TokenType.CLOSE_PAREN;
      tokenString = ')';
    } else if (this.str[this.index] === '{') {
      tokenType = TokenType.OPEN_BRACE;
      tokenString = '{';
    } else if (this.str[this.index] === '}') {
      tokenType = TokenType.CLOSE_BRACE;
      tokenString = '}';
    } else if (this.str[this.index] === ',') {
      tokenType = TokenType.COMMA;
      tokenString = ',';
    } else if (this.str[this.index] === ':') {
      tokenType = TokenType.COLON;
      tokenString = ':';
    } else if (this.str[this.index] === '@') {
      tokenType = TokenType.AT;
      tokenString = '@';
    } else if (this.str[this.index] === '[') {
      tokenType = TokenType.OPEN_BRACKET;
      tokenString = '[';
    } else if (this.str[this.index] === ']') {
      tokenType = TokenType.CLOSE_BRACKET;
      tokenString = ']';
    } else if (this.str.slice(this.index, this.index + 2) === '->') {
      tokenType = TokenType.ARROW;
      tokenString = '->';
    } else {
      tokenType = TokenType.TEXT;
      if (this.str[this.index] === '\\') {
        let nextChar = this.str[this.index + 1];
        if ('\\/[{])'.includes(nextChar)) {
          tokenEndIndex = this.index + 2;
          tokenString = nextChar;
        } else if (nextChar === 'n') {
          tokenEndIndex = this.index + 2;
          tokenString = '\n';
        } else if (nextChar === 't') {
          tokenEndIndex = this.index + 2;
          tokenString = '\t';
        } else if (nextChar === 'r') {
          tokenEndIndex = this.index + 2;
          tokenString = '\r';
        } else {
          tokenString = '\\';
        }
      } else {
        tokenString = this.str[this.index];
      }
    }

    if (tokenEndIndex === null) {
      tokenEndIndex = tokenIndex + tokenString.length;
    }
    let token = new Token(tokenType, tokenIndex, tokenEndIndex, tokenString);
    return token;
  }

  _determineNextReal(): Token | null {
    let inLineComment = false;
    let inBlockComment = false;
    let token;
    let startIndex = this.index;

    while ((token = this._determineNextRaw()) !== null) {
      if (inLineComment) {
        if (token.tokenType === TokenType.NEW_LINE
          || token.tokenType === TokenType.VISUAL_NEW_LINE) {
          inLineComment = false;
          return new Token(TokenType.NEW_LINE, token.index, token.endIndex, token.str);
        }
      } else if (inBlockComment) {
        if (token.tokenType === TokenType.CLOSE_BLOCK_COMMENT) {
          // Block comments output a single whitespace positioned at
          // the closing slash of the `*/`
          let virtualSpaceIdx = token.index + 1;
          return new Token(TokenType.WHITESPACE, virtualSpaceIdx, virtualSpaceIdx + 1, ' ');
        }
      } else {
        if (token.tokenType === TokenType.COMMENT) {
          // Use some hacky checks to work around lack of lookbehind
          // and elegant lookahead.
          let commentFollowedByWhitespace = token.index >= this.str.length
            || ANY_WHITESPACE_RE.test(this.str[token.endIndex]);
          let commentPrecededByWhitespace = token.index === 0
            || ANY_WHITESPACE_RE.test(this.str[token.index - 1]);
          if (commentPrecededByWhitespace || commentFollowedByWhitespace) {
            inLineComment = true;
          } else {
            // If line comment isn't preceded or followed by whitespace,
            // emit a TEXT token for it instead.
            return new Token(TokenType.TEXT, token.index, token.endIndex, token.str);
          }
        } else if (token.tokenType === TokenType.OPEN_BLOCK_COMMENT) {
          inBlockComment = true;
        } else {
          this.index = startIndex;
          return token;
        }
      }
      // Determining the next real token currently requires
      // fake-consuming tokens until a real one is found.  It's a bad
      // hack, but `this.index` should be reset to the initial
      // position before this function exits.
      this.index = token.endIndex;
    }
    this.index = startIndex;
    return null;
  }

  next(): Token | null {
    let token;
    if (this._cachedNext !== null) {
      token = this._cachedNext;
      this._cachedNext = null;
    } else {
      token = this._determineNextReal();
    }
    if (token !== null) {
      this.index = token.endIndex;
    } else {
      this.index = this.str.length;
    }
    return token;
  }

  peek(): Token | null {
    if (this._cachedNext !== null) {
      return this._cachedNext;
    }
    let token = this._determineNextReal();
    this._cachedNext = token;
    return token;
  }

  nextSatisfying(predicate: (a: Token) => boolean): Token | null {
    let token;
    while ((token = this.next()) !== null) {
      if (predicate(token)) {
        return token;
      }
    }
    return null;
  }

  nextNonWhitespace(): Token | null {
    return this.nextSatisfying((t) =>
      (t.tokenType !== TokenType.WHITESPACE && t.tokenType !== TokenType.NEW_LINE));
  }
}
