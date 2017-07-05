var assert = require('assert');
var expect = require('chai').expect;

var Lexer = require('../src/lexer.js').Lexer;
var Token = require('../src/token.js').Token;
var TokenType = require('../src/tokenType.js').TokenType;


describe('Lexer', function() {

  it("doesn't explode with an empty string", function() {
    var lexer = new Lexer('');
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes new lines', function() {
    var lexer = new Lexer('\n');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.NEW_LINE, 0, '\n'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes CLRF new lines', function() {
    var lexer = new Lexer('\r\n');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.NEW_LINE, 0, '\r\n'));
    assert.strictEqual(lexer.next(), null);
  });

  it("tokenizes spaces and tabs as WHITESPACE", function() {
    var lexer = new Lexer(' ');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.WHITESPACE, 0, ' '));
    assert.strictEqual(lexer.next(), null);

    lexer = new Lexer('\t');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.WHITESPACE, 0, '\t'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes comments', function() {
    var lexer = new Lexer('//');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.COMMENT, 0, '//'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes single quotes', function() {
    var lexer = new Lexer('\'');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.SINGLE_QUOTE, 0, '\''));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes double quotes', function() {
    var lexer = new Lexer('"');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.DOUBLE_QUOTE, 0, '"'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the letter r', function() {
    var lexer = new Lexer('r');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.LETTER_R, 0, 'r'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes open paren', function() {
    var lexer = new Lexer('(');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.OPEN_PAREN, 0, '('));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes close paren', function() {
    var lexer = new Lexer(')');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.CLOSE_PAREN, 0, ')'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes open brace', function() {
    var lexer = new Lexer('{');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.OPEN_BRACE, 0, '{'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes close brace', function() {
    var lexer = new Lexer('}');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.CLOSE_BRACE, 0, '}'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes commas', function() {
    var lexer = new Lexer(',');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.COMMA, 0, ','));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the keyword "as"', function() {
    var lexer = new Lexer('as');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_AS, 0, 'as'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the keyword "call"', function() {
    var lexer = new Lexer('call');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_CALL, 0, 'call'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the keyword "evaluate"', function() {
    var lexer = new Lexer('evaluate');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_EVALUATE, 0, 'evaluate'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the keyword "mode"', function() {
    var lexer = new Lexer('mode');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_MODE, 0, 'mode'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the keyword "begin"', function() {
    var lexer = new Lexer('begin');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_BEGIN, 0, 'begin'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the keyword "use"', function() {
    var lexer = new Lexer('use');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_USE, 0, 'use'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the "using" as a synonym for the keyword "use"', function() {
    var lexer = new Lexer('using');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_USE, 0, 'using'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes misc characters as individual text tokens', function() {
    var lexer = new Lexer('ab%');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, 'a'));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 1, 'b'));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 2, '%'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes numbers', function() {
    var lexer = new Lexer('12345');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.NUMBER, 0, '12345'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes numbers with decimal places', function() {
    var lexer = new Lexer('12345.67');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.NUMBER, 0, '12345.67'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes numbers with a leading decimal', function() {
    var lexer = new Lexer('.67');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.NUMBER, 0, '.67'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes known escape sequences', function() {
    var lexer = new Lexer('\\n');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\n'));
    assert.strictEqual(lexer.next(), null);

    lexer = new Lexer('\\t');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\t'));
    assert.strictEqual(lexer.next(), null);

    lexer = new Lexer('\\r');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\r'));
    assert.strictEqual(lexer.next(), null);

    lexer = new Lexer("\\'");
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\''));
    assert.strictEqual(lexer.next(), null);

    lexer = new Lexer('\\"');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\"'));
    assert.strictEqual(lexer.next(), null);
  });

  it('treats backslashes before unknown escape sequences as literal', function() {
    var lexer = new Lexer('\\f');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\\'));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 1, 'f'));
    assert.strictEqual(lexer.next(), null);
  });

  it('can peek at the next token without consuming it', function() {
    var lexer = new Lexer('ab');
    assert.deepStrictEqual(lexer.peek(), new Token(TokenType.TEXT, 0, 'a'));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, 'a'));
    assert.deepStrictEqual(lexer.peek(), new Token(TokenType.TEXT, 1, 'b'));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 1, 'b'));
    assert.strictEqual(lexer.peek(), null);
    assert.strictEqual(lexer.next(), null);
  });

  it('can pass over whitespace and comments', function() {
    var testString = `test

        test2
        // comment
        test3`;
    var lexer = new Lexer(testString);
    lexer.skipWhitespaceAndComments();
    expect(lexer.index).to.equal(0);

    lexer.overrideIndex(testString.indexOf('test') + 'test'.length);
    lexer.skipWhitespaceAndComments();
    expect(lexer.index).to.equal(testString.indexOf('test2'));

    lexer.overrideIndex(testString.indexOf('test2') + 'test2'.length);
    lexer.skipWhitespaceAndComments();
    expect(lexer.index).to.equal(testString.indexOf('test3'));
  });

});
