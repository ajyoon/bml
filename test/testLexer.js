var assert = require('assert');

var Lexer = require('../src/lexer.js').Lexer;
var Token = require('../src/token.js').Token;
var TokenType = require('../src/tokenType.js').TokenType;


describe('Lexer', function() {

  it("doesn't explode with an empty string", function() {
    var lexer = new Lexer('');
    assert.equal(lexer.next(), null);
  });

  it('tokenizes new lines', function() {
    var lexer = new Lexer('\n');
    assert.deepEqual(lexer.next(), new Token(TokenType.NEW_LINE, 0, '\n'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes CLRF new lines', function() {
    var lexer = new Lexer('\r\n');
    assert.deepEqual(lexer.next(), new Token(TokenType.NEW_LINE, 0, '\r\n'));
    assert.equal(lexer.next(), null);
  });

  it("tokenizes spaces and tabs as WHITESPACE", function() {
    var lexer = new Lexer(' ');
    assert.deepEqual(lexer.next(), new Token(TokenType.WHITESPACE, 0, ' '));
    assert.equal(lexer.next(), null);

    lexer = new Lexer('\t');
    assert.deepEqual(lexer.next(), new Token(TokenType.WHITESPACE, 0, '\t'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes comments', function() {
    var lexer = new Lexer('//');
    assert.deepEqual(lexer.next(), new Token(TokenType.COMMENT, 0, '//'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes single quotes', function() {
    var lexer = new Lexer('\'');
    assert.deepEqual(lexer.next(), new Token(TokenType.SINGLE_QUOTE, 0, '\''));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes the letter r', function() {
    var lexer = new Lexer('r');
    assert.deepEqual(lexer.next(), new Token(TokenType.LETTER_R, 0, 'r'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes open paren', function() {
    var lexer = new Lexer('(');
    assert.deepEqual(lexer.next(), new Token(TokenType.OPEN_PAREN, 0, '('));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes close paren', function() {
    var lexer = new Lexer(')');
    assert.deepEqual(lexer.next(), new Token(TokenType.CLOSE_PAREN, 0, ')'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes open brace', function() {
    var lexer = new Lexer('{');
    assert.deepEqual(lexer.next(), new Token(TokenType.OPEN_BRACE, 0, '{'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes close brace', function() {
    var lexer = new Lexer('}');
    assert.deepEqual(lexer.next(), new Token(TokenType.CLOSE_BRACE, 0, '}'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes commas', function() {
    var lexer = new Lexer(',');
    assert.deepEqual(lexer.next(), new Token(TokenType.COMMA, 0, ','));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes the keyword "as"', function() {
    var lexer = new Lexer('as');
    assert.deepEqual(lexer.next(), new Token(TokenType.KW_AS, 0, 'as'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes the keyword "call"', function() {
    var lexer = new Lexer('call');
    assert.deepEqual(lexer.next(), new Token(TokenType.KW_CALL, 0, 'call'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes the keyword "evaluate"', function() {
    var lexer = new Lexer('evaluate');
    assert.deepEqual(lexer.next(), new Token(TokenType.KW_EVALUATE, 0, 'evaluate'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes the keyword "mode"', function() {
    var lexer = new Lexer('mode');
    assert.deepEqual(lexer.next(), new Token(TokenType.KW_MODE, 0, 'mode'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes the keyword "begin"', function() {
    var lexer = new Lexer('begin');
    assert.deepEqual(lexer.next(), new Token(TokenType.KW_BEGIN, 0, 'begin'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes the keyword "use"', function() {
    var lexer = new Lexer('use');
    assert.deepEqual(lexer.next(), new Token(TokenType.KW_USE, 0, 'use'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes the "using" as a synonym for the keyword "use"', function() {
    var lexer = new Lexer('using');
    assert.deepEqual(lexer.next(), new Token(TokenType.KW_USE, 0, 'using'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes misc characters as individual text tokens', function() {
    var lexer = new Lexer('ab%');
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 0, 'a'));
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 1, 'b'));
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 2, '%'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes numbers', function() {
    var lexer = new Lexer('12345');
    assert.deepEqual(lexer.next(), new Token(TokenType.NUMBER, 0, '12345'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes numbers with decimal places', function() {
    var lexer = new Lexer('12345.67');
    assert.deepEqual(lexer.next(), new Token(TokenType.NUMBER, 0, '12345.67'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes numbers with a leading decimal', function() {
    var lexer = new Lexer('.67');
    assert.deepEqual(lexer.next(), new Token(TokenType.NUMBER, 0, '.67'));
    assert.equal(lexer.next(), null);
  });

  it('tokenizes known escape sequences', function() {
    var lexer = new Lexer('\\n');
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\n'));
    assert.equal(lexer.next(), null);

    lexer = new Lexer('\\t');
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\t'));
    assert.equal(lexer.next(), null);

    lexer = new Lexer('\\r');
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\r'));
    assert.equal(lexer.next(), null);

    lexer = new Lexer("\\'");
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\''));
    assert.equal(lexer.next(), null);

    lexer = new Lexer('\\"');
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\"'));
    assert.equal(lexer.next(), null);
  });

  it('treats backslashes before unknown escape sequences as literal', function() {
    var lexer = new Lexer('\\f');
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\\'));
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 1, 'f'));
    assert.equal(lexer.next(), null);
  });

  it('remembers the last token it saw', function() {
    var lexer = new Lexer('ab');
    assert.equal(lexer.lastToken, null);
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 0, 'a'));
    assert.deepEqual(lexer.lastToken, new Token(TokenType.TEXT, 0, 'a'));
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 1, 'b'));
    assert.deepEqual(lexer.lastToken, new Token(TokenType.TEXT, 1, 'b'));
    assert.equal(lexer.next(), null);
  });

  it('can peek at the next token', function() {
    var lexer = new Lexer('ab');
    assert.deepEqual(lexer.peek(), new Token(TokenType.TEXT, 0, 'a'));
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 0, 'a'));
    assert.deepEqual(lexer.lastToken, new Token(TokenType.TEXT, 0, 'a'));
    assert.deepEqual(lexer.peek(), new Token(TokenType.TEXT, 1, 'b'));
    assert.deepEqual(lexer.next(), new Token(TokenType.TEXT, 1, 'b'));
    assert.deepEqual(lexer.lastToken, new Token(TokenType.TEXT, 1, 'b'));
    assert.equal(lexer.peek(), null);
    assert.equal(lexer.next(), null);
  });

});
