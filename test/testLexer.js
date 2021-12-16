const expect = require('expect');

const Lexer = require('../src/lexer.ts').Lexer;
const Token = require('../src/token.ts').Token;
const TokenType = require('../src/tokenType.ts').TokenType;


describe('Lexer', function() {
  it('doesn\'t explode with an empty string', function() {
    let lexer = new Lexer('');
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes new lines', function() {
    let lexer = new Lexer('\n');
    expect(lexer.next()).toEqual(new Token(TokenType.NEW_LINE, 0, '\n'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes CLRF new lines', function() {
    let lexer = new Lexer('\r\n');
    expect(lexer.next()).toEqual(new Token(TokenType.NEW_LINE, 0, '\r\n'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes spaces and tabs as WHITESPACE', function() {
    let lexer = new Lexer(' ');
    expect(lexer.next()).toEqual(new Token(TokenType.WHITESPACE, 0, ' '));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer('\t');
    expect(lexer.next()).toEqual(new Token(TokenType.WHITESPACE, 0, '\t'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes comments', function() {
    let lexer = new Lexer('//');
    expect(lexer._determineNextRaw()).toEqual(new Token(TokenType.COMMENT, 0, '//'));
  });

  it('tokenizes block comment openings', function() {
    let lexer = new Lexer('/*');
    expect(lexer._determineNextRaw()).toEqual(new Token(TokenType.OPEN_BLOCK_COMMENT, 0, '/*'));
  });

  it('tokenizes block comment closings', function() {
    let lexer = new Lexer('*/');
    expect(lexer.next()).toEqual(new Token(TokenType.CLOSE_BLOCK_COMMENT, 0, '*/'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes slashes', function() {
    let lexer = new Lexer('/');
    expect(lexer.next()).toEqual(new Token(TokenType.SLASH, 0, '/'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes asterisks', function() {
    let lexer = new Lexer('*');
    expect(lexer.next()).toEqual(new Token(TokenType.ASTERISK, 0, '*'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes single quotes', function() {
    let lexer = new Lexer('\'');
    expect(lexer.next()).toEqual(new Token(TokenType.SINGLE_QUOTE, 0, '\''));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes double quotes', function() {
    let lexer = new Lexer('"');
    expect(lexer.next()).toEqual(new Token(TokenType.DOUBLE_QUOTE, 0, '"'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes backticks', function() {
    let lexer = new Lexer('`');
    expect(lexer.next()).toEqual(new Token(TokenType.BACKTICK, 0, '`'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes open paren', function() {
    let lexer = new Lexer('(');
    expect(lexer.next()).toEqual(new Token(TokenType.OPEN_PAREN, 0, '('));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes close paren', function() {
    let lexer = new Lexer(')');
    expect(lexer.next()).toEqual(new Token(TokenType.CLOSE_PAREN, 0, ')'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes open brace', function() {
    let lexer = new Lexer('{');
    expect(lexer.next()).toEqual(new Token(TokenType.OPEN_BRACE, 0, '{'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes close brace', function() {
    let lexer = new Lexer('}');
    expect(lexer.next()).toEqual(new Token(TokenType.CLOSE_BRACE, 0, '}'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes commas', function() {
    let lexer = new Lexer(',');
    expect(lexer.next()).toEqual(new Token(TokenType.COMMA, 0, ','));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes colons', function() {
    let lexer = new Lexer(':');
    expect(lexer.next()).toEqual(new Token(TokenType.COLON, 0, ':'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes at', function() {
    let lexer = new Lexer('@');
    expect(lexer.next()).toEqual(new Token(TokenType.AT, 0, '@'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes pipe', function() {
    let lexer = new Lexer('|');
    expect(lexer.next()).toEqual(new Token(TokenType.PIPE, 0, '|'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes arrow', function() {
    let lexer = new Lexer('->');
    expect(lexer.next()).toEqual(new Token(TokenType.ARROW, 0, '->'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes open double bracket', function() {
    let lexer = new Lexer('[[');
    expect(lexer.next()).toEqual(new Token(TokenType.OPEN_DOUBLE_BRACKET, 0, '[['));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes close double bracket', function() {
    let lexer = new Lexer(']]');
    expect(lexer.next()).toEqual(new Token(TokenType.CLOSE_DOUBLE_BRACKET, 0, ']]'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes the keyword "as"', function() {
    let lexer = new Lexer('as');
    expect(lexer.next()).toEqual(new Token(TokenType.KW_AS, 0, 'as'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes the keyword "call"', function() {
    let lexer = new Lexer('call');
    expect(lexer.next()).toEqual(new Token(TokenType.KW_CALL, 0, 'call'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes the keyword "eval"', function() {
    let lexer = new Lexer('eval');
    expect(lexer.next()).toEqual(new Token(TokenType.KW_EVAL, 0, 'eval'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes the keyword "mode"', function() {
    let lexer = new Lexer('mode');
    expect(lexer.next()).toEqual(new Token(TokenType.KW_MODE, 0, 'mode'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes the keyword "use"', function() {
    let lexer = new Lexer('use');
    expect(lexer.next()).toEqual(new Token(TokenType.KW_USE, 0, 'use'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes the keyword "match"', function() {
    let lexer = new Lexer('match');
    expect(lexer.next()).toEqual(new Token(TokenType.KW_MATCH, 0, 'match'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes misc characters as individual text tokens', function() {
    let lexer = new Lexer('ab%');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 'a'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 1, 'b'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 2, '%'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes numbers', function() {
    let lexer = new Lexer('12345');
    expect(lexer.next()).toEqual(new Token(TokenType.NUMBER, 0, '12345'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes numbers with decimal places', function() {
    let lexer = new Lexer('12345.67');
    expect(lexer.next()).toEqual(new Token(TokenType.NUMBER, 0, '12345.67'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes numbers with a leading decimal', function() {
    let lexer = new Lexer('.67');
    expect(lexer.next()).toEqual(new Token(TokenType.NUMBER, 0, '.67'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes escaped backslashes as text', function() {
    let lexer = new Lexer('\\\\');
    let token = lexer.next();
    expect(token).toEqual(new Token(TokenType.TEXT, 0, '\\\\'));
    expect(token.str.length).toBe(2);
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes escaped backslashes surrounded by quotes', function() {
    let lexer = new Lexer("'\\\\'");
    expect(lexer.next()).toEqual(new Token(TokenType.SINGLE_QUOTE, 0, "\'"));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 1, "\\\\"));
    expect(lexer.next()).toEqual(new Token(TokenType.SINGLE_QUOTE, 3, "\'"));
    expect(lexer.next()).toEqual(null);
  });

  it('tokenizes escape sequences without consuming the following character', function() {
    let lexer = new Lexer('\\nP');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, '\n'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 2, 'P'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes known escape sequences', function() {
    let lexer = new Lexer('\\n');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, '\n'));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer('\\t');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, '\t'));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer('\\r');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, '\r'));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer("\\'");
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, '\''));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer('\\"');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, '\"'));
    expect(lexer.next()).toBeNull();
  });

  it('treats backslashes before unknown escape sequences as literal', function() {
    let lexer = new Lexer('\\f');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, '\\'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 1, 'f'));
    expect(lexer.next()).toBeNull();
  });

  it('can peek at the next token without consuming it', function() {
    let lexer = new Lexer('ab');
    expect(lexer.peek()).toEqual(new Token(TokenType.TEXT, 0, 'a'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 'a'));
    expect(lexer.peek()).toEqual(new Token(TokenType.TEXT, 1, 'b'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 1, 'b'));
    expect(lexer.peek()).toBeNull();
    expect(lexer.next()).toBeNull();
  });

  it('automatically skips line comments', function() {
    let lexer = new Lexer('//foo\ntest');
    expect(lexer.peek()).toEqual(new Token(TokenType.TEXT, 6, 't'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 6, 't'));
  });

  it('skips over sequential line comments', function() {
    let lexer = new Lexer('//foo\n//bar\ntest');
    expect(lexer.peek()).toEqual(new Token(TokenType.TEXT, 12, 't'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 12, 't'));
  });

  it('converts block comments into a single white space', function() {
    let lexer = new Lexer('/* foo \n\n  bar    */test');
    expect(lexer.peek()).toEqual(new Token(TokenType.WHITESPACE, 19, ' '));
    expect(lexer.next()).toEqual(new Token(TokenType.WHITESPACE, 19, ' '));
    expect(lexer.peek()).toEqual(new Token(TokenType.TEXT, 20, 't'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 20, 't'));
  });

  it('can skip to the next token satisfying a predicate', function() {
    let lexer = new Lexer('abc');
    expect(lexer.nextSatisfying((t) => t.str === 'b')).toEqual(new Token(TokenType.TEXT, 1, 'b'));
  });

  it('can skip to the next non-whitespace (or comment) token', function() {
    let lexer = new Lexer('   \n\n test');
    expect(lexer.nextNonWhitespace()).toEqual(new Token(TokenType.TEXT, 6, 't'));
  });
});
