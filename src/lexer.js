var Token = require('./token.js').Token;
var TokenType = require('./tokenType.js').TokenType;

class Lexer {
  constructor(string) {
    this.string = string;
    this.index = 0;
    this.lastToken = null;
    this._newLineRe = /\r?\n/y;
    this._whitespaceRe = /\s+/y;
    this._numberRe = /(\d+(\.\d+)?)|(\.\d+)/y;
  }

  next() {
    if (this.index >= this.string.length) {
      this.lastToken = null;
      return null;
    }
    var tokenType;
    var tokenIndex = this.index;
    var tokenString;
    this._newLineRe.lastIndex = this.index;
    this._whitespaceRe.lastIndex = this.index;
    this._numberRe.lastIndex = this.index;
    var newLineMatch = this._newLineRe.exec(this.string);
    var whitespaceMatch = this._whitespaceRe.exec(this.string);
    var numberMatch = this._numberRe.exec(this.string);
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
    } else if (this.string[this.index] === '\'') {
      tokenType = TokenType.SINGLE_QUOTE;
      tokenString = '\'';
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
      // synonym for 'use'
      tokenType = TokenType.KW_USE;
      tokenString = 'using';
    } else if (this.string[this.index] === 'r') {
      tokenType = TokenType.LETTER_R;
      tokenString = 'r';
    } else {
      tokenType = TokenType.TEXT;
      if (this.string[this.index] === '\\') {
        switch (this.string[this.index + 1]) {
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
    this.index += tokenString.length;
    var token = new Token(tokenType, tokenIndex, tokenString);
    this.lastToken = token;
    return token;
  }
}

exports.Lexer = Lexer;
