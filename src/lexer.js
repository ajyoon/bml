var Token = require('./token.js').Token;
var TokenType = require('./tokenType.js').TokenType;

class Lexer {
  constructor(string) {
    this.string = string;
    this.index = 0;
    this._whitespaceRe = /\s+/y;
    this._currentTextToken = '';
  }

  nextToken() {
    var tokenType;
    var tokenIndex = this.index;
    var tokenString;
    this._whitespaceRe.lastIndex = this.index;
    var whitespaceMatch = this._whitespaceRe.exec(this.string);
    if (whitespaceMatch !== null) {
      this.index = this._whitespaceRe.lastIndex;
      return this.nextToken();
    } else if (this.string.slice(this.index, this.index + 2) === '//') {
      tokenType = TokenType.COMMENT;
      tokenString = '//';
    } else if (this.string[this.index] === '\'') {
      tokenType = TokenType.SINGLE_QUOTE;
      tokenString = '\'';
    } else if (this.string.slice(this.index, this.index + 2) === 'r\'') {
      tokenType = TokenType.RE_SINGLE_QUOTE;
      tokenString = '';
    } else if (this.string[this.index] === '(') {
      tokenType = TokenType.OPEN_PAREN;
      tokenString = '(';
    } else if (this.string[this.index] === ')') {
      tokenType = TokenType.CLOSE_PAREN;
      tokenString = '(';
    } else if (this.string[this.index] === '{') {
      tokenType = TokenType.OPEN_BRACE;
      tokenString = '{';
    } else if (this.string[this.index] === '}') {
      tokenType = TokenType.CLOSE_BRACE;
      tokenString = '}';
    } else if (this.string[this.index] === ',') {
      tokenType = TokenType.COMMA;
      tokenString = '}';
    } else if (this.string.slice(this.index, this.index + 2) === 'as') {
      tokenType = TokenType.KW_AS;
      tokenString = 'as';
    } else if (this.string.slice(this.index, this.index + 4) === 'call') {
      tokenType = TokenType.KW_CALL;
      tokenString = 'call';
    } else if (this.string.slice(this.index, this.index + 8) === 'evaluate') {
      tokenType = TokenType.KW_EVALUATE;
      tokenString = 'evaluate';
    } else if (this.string.slice(this.index, this.index + 4) === 'mode') {
      tokenType = TokenType.KW_MODE;
      tokenString = 'mode';
    } else if (this.string.slice(this.index, this.index + 5) === 'begin') {
      tokenType = TokenType.KW_BEGIN;
      tokenString = 'begin';
    } else if (this.string.slice(this.index, this.index + 3) === 'use') {
      tokenType = TokenType.KW_USE;
      tokenString = 'use';
    } else if (this.string.slice(this.index, this.index + 5) === 'using') {
      tokenType = TokenType.KW_USING;
      tokenString = 'using';
    } else {
      tokenType = TokenType.TEXT;
      tokenString = this.string[this.index];
    }
    this.index += tokenString.length;
    return new Token(tokenType, tokenIndex, tokenString);
  }
}

exports.Lexer = Lexer;
