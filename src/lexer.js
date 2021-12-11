const Token = require('./token.js').Token;
const TokenType = require('./tokenType.js').TokenType;

class Lexer {
  constructor(string) {
    this.string = string;
    this.index = 0;
    this._cachedNext = null;
    this._newLineRe = /\r?\n/y;
    this._whitespaceRe = /\s+/y;
    this._numberRe = /(\d+(\.\d+)?)|(\.\d+)/y;
  }

  /**
   * Set this.index and invalidate the next-token cache
   */
  overrideIndex(newIndex) {
    this._cachedNext = null;
    this.index = newIndex;
  }

  /**
   * Determine the next item in the token stream
   */
  _determineNextRaw() {
    if (this.index >= this.string.length) {
      return null;
    }
    let tokenType;
    let tokenIndex = this.index;
    let tokenString;
    this._newLineRe.lastIndex = this.index;
    this._whitespaceRe.lastIndex = this.index;
    this._numberRe.lastIndex = this.index;
    let newLineMatch = this._newLineRe.exec(this.string);
    let whitespaceMatch = this._whitespaceRe.exec(this.string);
    let numberMatch = this._numberRe.exec(this.string);
    if (newLineMatch !== null) {
      tokenType = TokenType.NEW_LINE;
      tokenString = newLineMatch[0];
    } else if (whitespaceMatch !== null) {
      tokenType = TokenType.WHITESPACE;
      tokenString = whitespaceMatch[0];
    } else if (numberMatch !== null) {
      tokenType = TokenType.NUMBER;
      tokenString = numberMatch[0];
    } else if (this.string.slice(this.index, this.index + 2) === '//') {
      tokenType = TokenType.COMMENT;
      tokenString = '//';
    } else if (this.string.slice(this.index, this.index + 2) === '/*') {
      tokenType = TokenType.OPEN_BLOCK_COMMENT;
      tokenString = '/*';
    } else if (this.string.slice(this.index, this.index + 2) === '*/') {
      tokenType = TokenType.CLOSE_BLOCK_COMMENT;
      tokenString = '*/';
    } else if (this.string[this.index] === '/') {
      tokenType = TokenType.SLASH;
      tokenString = '/';
    } else if (this.string[this.index] === '*') {
      tokenType = TokenType.ASTERISK;
      tokenString = '*';
    } else if (this.string[this.index] === '\'') {
      tokenType = TokenType.SINGLE_QUOTE;
      tokenString = '\'';
    } else if (this.string[this.index] === '"') {
      tokenType = TokenType.DOUBLE_QUOTE;
      tokenString = '"';
    } else if (this.string[this.index] === '`') {
      tokenType = TokenType.BACKTICK;
      tokenString = '`';
    } else if (this.string[this.index] === '(') {
      tokenType = TokenType.OPEN_PAREN;
      tokenString = '(';
    } else if (this.string[this.index] === ')') {
      tokenType = TokenType.CLOSE_PAREN;
      tokenString = ')';
    } else if (this.string[this.index] === '{') {
      tokenType = TokenType.OPEN_BRACE;
      tokenString = '{';
    } else if (this.string[this.index] === '}') {
      tokenType = TokenType.CLOSE_BRACE;
      tokenString = '}';
    } else if (this.string[this.index] === ',') {
      tokenType = TokenType.COMMA;
      tokenString = ',';
    } else if (this.string[this.index] === ':') {
      tokenType = TokenType.COLON;
      tokenString = ':';
    } else if (this.string[this.index] === '@') {
      tokenType = TokenType.AT;
      tokenString = '@';
    } else if (this.string[this.index] === '|') {
      tokenType = TokenType.PIPE;
      tokenString = '|';
    } else if (this.string.slice(this.index, this.index + 2) === '->') {
      tokenType = TokenType.ARROW;
      tokenString = '->';
    } else if (this.string.slice(this.index, this.index + 2) === 'as') {
      tokenType = TokenType.KW_AS;
      tokenString = 'as';
    } else if (this.string.slice(this.index, this.index + 4) === 'call') {
      tokenType = TokenType.KW_CALL;
      tokenString = 'call';
    } else if (this.string.slice(this.index, this.index + 4) === 'eval') {
      tokenType = TokenType.KW_EVAL;
      tokenString = 'eval';
    } else if (this.string.slice(this.index, this.index + 4) === 'mode') {
      tokenType = TokenType.KW_MODE;
      tokenString = 'mode';
    } else if (this.string.slice(this.index, this.index + 3) === 'use') {
      tokenType = TokenType.KW_USE;
      tokenString = 'use';
    } else if (this.string.slice(this.index, this.index + 5) === 'match') {
      tokenType = TokenType.KW_MATCH;
      tokenString = 'match';
    } else {
      tokenType = TokenType.TEXT;
      if (this.string[this.index] === '\\') {
        switch (this.string[this.index + 1]) {
        case '\\':
          tokenString = '\\\\';
          break;
        case '/':
          tokenString = '/';
          this.index++;
          break;
        case 'n':
          tokenString = '\n';
          this.index++;
          break;
        case 't':
          tokenString = '\t';
          this.index++;
          break;
        case 'r':
          tokenString = '\r';
          this.index++;
          break;
        case '\'':
          tokenString = '\'';
          this.index++;
          break;
        case '\"':
          tokenString = '\"';
          this.index++;
          break;
        default:
          tokenString = '\\';
        }
      } else {
        tokenString = this.string[this.index];
      }
    }
    let token = new Token(tokenType, tokenIndex, tokenString);
    return token;
  }
  
  _determineNextReal() {
    let inLineComment = false;
    let inBlockComment = false;
    let token;
    while ((token = this._determineNextRaw()) !== null) {
      if (inLineComment) {
        if (token.tokenType === TokenType.NEW_LINE) {
          inLineComment = false;
        }
      } else if (inBlockComment) {
        if (token.tokenType === TokenType.CLOSE_BLOCK_COMMENT) {
          // Block comments output a single whitespace positioned at
          // the closing slash of the `*/`
          let virtualWhitespaceTokenIdx = token.index + 1;
          this.index = virtualWhitespaceTokenIdx;
          return new Token(TokenType.WHITESPACE, virtualWhitespaceTokenIdx, ' ');
        }
      } else {
        if (token.tokenType === TokenType.COMMENT) {
          inLineComment = true;
        } else if (token.tokenType === TokenType.OPEN_BLOCK_COMMENT) {
          inBlockComment = true;
        } else {
          return token;
        }
      }
      this.index = token.index + token.string.length;
    }
    return null;
  }

  next() {
    let token;
    if (this._cachedNext !== null) {
      token = this._cachedNext;
      this._cachedNext = null;
    } else {
      token = this._determineNextReal();
    }
    if (token !== null) {
      this.index += token.string.length;
    }
    return token;
  }

  peek() {
    if (this._cachedNext !== null) {
      return this._cachedNext;
    }
    let token = this._determineNextReal();
    this._cachedNext = token;
    return token;
  }
  
  nextSatisfying(predicate) {
    let token;
    while ((token = this.next()) !== null) {
      if (predicate(token)) {
        return token;
      }
    }
    return null;
  }
  
  nextNonWhitespace() {
    return this.nextSatisfying((t) =>
      (t.tokenType !== TokenType.WHITESPACE && t.tokenType !== TokenType.NEW_LINE));
  }
}

exports.Lexer = Lexer;
