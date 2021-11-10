const assert = require('assert');
const expect = require('chai').expect;

const Lexer = require('../src/lexer.js').Lexer;
const Token = require('../src/token.js').Token;
const TokenType = require('../src/tokenType.js').TokenType;


describe('Lexer', function() {
  it('doesn\'t explode with an empty string', function() {
    let lexer = new Lexer('');
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes new lines', function() {
    let lexer = new Lexer('\n');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.NEW_LINE, 0, '\n'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes CLRF new lines', function() {
    let lexer = new Lexer('\r\n');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.NEW_LINE, 0, '\r\n'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes spaces and tabs as WHITESPACE', function() {
    let lexer = new Lexer(' ');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.WHITESPACE, 0, ' '));
    assert.strictEqual(lexer.next(), null);

    lexer = new Lexer('\t');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.WHITESPACE, 0, '\t'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes comments', function() {
    let lexer = new Lexer('//');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.COMMENT, 0, '//'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes block comment openings', function() {
    let lexer = new Lexer('/*');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.OPEN_BLOCK_COMMENT, 0, '/*'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes block comment closings', function() {
    let lexer = new Lexer('*/');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.CLOSE_BLOCK_COMMENT, 0, '*/'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes slashes', function() {
    let lexer = new Lexer('/');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.SLASH, 0, '/'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes asterisks', function() {
    let lexer = new Lexer('*');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.ASTERISK, 0, '*'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes single quotes', function() {
    let lexer = new Lexer('\'');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.SINGLE_QUOTE, 0, '\''));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes double quotes', function() {
    let lexer = new Lexer('"');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.DOUBLE_QUOTE, 0, '"'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes backticks', function() {
    let lexer = new Lexer('`');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.BACKTICK, 0, '`'));
    assert.strictEqual(lexer.next(), null);
  });
  
  it('tokenizes open paren', function() {
    let lexer = new Lexer('(');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.OPEN_PAREN, 0, '('));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes close paren', function() {
    let lexer = new Lexer(')');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.CLOSE_PAREN, 0, ')'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes open brace', function() {
    let lexer = new Lexer('{');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.OPEN_BRACE, 0, '{'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes close brace', function() {
    let lexer = new Lexer('}');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.CLOSE_BRACE, 0, '}'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes commas', function() {
    let lexer = new Lexer(',');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.COMMA, 0, ','));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes colons', function() {
    let lexer = new Lexer(':');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.COLON, 0, ':'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes at', function() {
    let lexer = new Lexer('@');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.AT, 0, '@'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes pipe', function() {
    let lexer = new Lexer('|');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.PIPE, 0, '|'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes arrow', function() {
    let lexer = new Lexer('->');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.ARROW, 0, '->'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the keyword "as"', function() {
    let lexer = new Lexer('as');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_AS, 0, 'as'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the keyword "call"', function() {
    let lexer = new Lexer('call');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_CALL, 0, 'call'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the keyword "eval"', function() {
    let lexer = new Lexer('eval');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_EVAL, 0, 'eval'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the keyword "mode"', function() {
    let lexer = new Lexer('mode');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_MODE, 0, 'mode'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes the keyword "use"', function() {
    let lexer = new Lexer('use');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.KW_USE, 0, 'use'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes misc characters as individual text tokens', function() {
    let lexer = new Lexer('ab%');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, 'a'));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 1, 'b'));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 2, '%'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes numbers', function() {
    let lexer = new Lexer('12345');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.NUMBER, 0, '12345'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes numbers with decimal places', function() {
    let lexer = new Lexer('12345.67');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.NUMBER, 0, '12345.67'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes numbers with a leading decimal', function() {
    let lexer = new Lexer('.67');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.NUMBER, 0, '.67'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes escaped backslashes as text', function() {
    let lexer = new Lexer('\\\\');
    let token = lexer.next();
    assert.deepStrictEqual(token, new Token(TokenType.TEXT, 0, '\\\\'));
    assert.strictEqual(token.string.length, 2);
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes escaped backslashes surrounded by quotes', function() {
    let lexer = new Lexer("'\\\\'");
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.SINGLE_QUOTE, 0, "\'"));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 1, "\\\\"));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.SINGLE_QUOTE, 3, "\'"));
    assert.deepStrictEqual(lexer.next(), null);
  });

  it('tokenizes escape sequences without consuming the following character', function() {
    let lexer = new Lexer('\\nP');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\n'));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 2, 'P'));
    assert.strictEqual(lexer.next(), null);
  });

  it('tokenizes known escape sequences', function() {
    let lexer = new Lexer('\\n');
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
    let lexer = new Lexer('\\f');
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, '\\'));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 1, 'f'));
    assert.strictEqual(lexer.next(), null);
  });

  it('can peek at the next token without consuming it', function() {
    let lexer = new Lexer('ab');
    assert.deepStrictEqual(lexer.peek(), new Token(TokenType.TEXT, 0, 'a'));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 0, 'a'));
    assert.deepStrictEqual(lexer.peek(), new Token(TokenType.TEXT, 1, 'b'));
    assert.deepStrictEqual(lexer.next(), new Token(TokenType.TEXT, 1, 'b'));
    assert.strictEqual(lexer.peek(), null);
    assert.strictEqual(lexer.next(), null);
  });

  it('can pass over whitespace and comments', function() {
    let testString = `test

        test2
        // comment
        test3`;
    let lexer = new Lexer(testString);
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
