const expect = require('chai').expect;

const Lexer = require('../src/lexer.js').Lexer;
const Token = require('../src/token.js').Token;
const TokenType = require('../src/tokenType.js').TokenType;


describe('Lexer', function() {
  it('doesn\'t explode with an empty string', function() {
    let lexer = new Lexer('');
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes new lines', function() {
    let lexer = new Lexer('\n');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.NEW_LINE, 0, '\n'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes CLRF new lines', function() {
    let lexer = new Lexer('\r\n');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.NEW_LINE, 0, '\r\n'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes spaces and tabs as WHITESPACE', function() {
    let lexer = new Lexer(' ');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.WHITESPACE, 0, ' '));
    expect(lexer.next()).to.equal(null);

    lexer = new Lexer('\t');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.WHITESPACE, 0, '\t'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes comments', function() {
    let lexer = new Lexer('//');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.COMMENT, 0, '//'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes block comment openings', function() {
    let lexer = new Lexer('/*');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.OPEN_BLOCK_COMMENT, 0, '/*'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes block comment closings', function() {
    let lexer = new Lexer('*/');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.CLOSE_BLOCK_COMMENT, 0, '*/'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes slashes', function() {
    let lexer = new Lexer('/');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.SLASH, 0, '/'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes asterisks', function() {
    let lexer = new Lexer('*');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.ASTERISK, 0, '*'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes single quotes', function() {
    let lexer = new Lexer('\'');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.SINGLE_QUOTE, 0, '\''));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes double quotes', function() {
    let lexer = new Lexer('"');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.DOUBLE_QUOTE, 0, '"'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes backticks', function() {
    let lexer = new Lexer('`');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.BACKTICK, 0, '`'));
    expect(lexer.next()).to.equal(null);
  });
  
  it('tokenizes open paren', function() {
    let lexer = new Lexer('(');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.OPEN_PAREN, 0, '('));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes close paren', function() {
    let lexer = new Lexer(')');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.CLOSE_PAREN, 0, ')'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes open brace', function() {
    let lexer = new Lexer('{');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.OPEN_BRACE, 0, '{'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes close brace', function() {
    let lexer = new Lexer('}');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.CLOSE_BRACE, 0, '}'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes commas', function() {
    let lexer = new Lexer(',');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.COMMA, 0, ','));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes colons', function() {
    let lexer = new Lexer(':');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.COLON, 0, ':'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes at', function() {
    let lexer = new Lexer('@');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.AT, 0, '@'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes pipe', function() {
    let lexer = new Lexer('|');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.PIPE, 0, '|'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes arrow', function() {
    let lexer = new Lexer('->');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.ARROW, 0, '->'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes the keyword "as"', function() {
    let lexer = new Lexer('as');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.KW_AS, 0, 'as'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes the keyword "call"', function() {
    let lexer = new Lexer('call');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.KW_CALL, 0, 'call'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes the keyword "eval"', function() {
    let lexer = new Lexer('eval');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.KW_EVAL, 0, 'eval'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes the keyword "mode"', function() {
    let lexer = new Lexer('mode');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.KW_MODE, 0, 'mode'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes the keyword "use"', function() {
    let lexer = new Lexer('use');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.KW_USE, 0, 'use'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes the keyword "match"', function() {
    let lexer = new Lexer('match');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.KW_MATCH, 0, 'match'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes misc characters as individual text tokens', function() {
    let lexer = new Lexer('ab%');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 0, 'a'));
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 1, 'b'));
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 2, '%'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes numbers', function() {
    let lexer = new Lexer('12345');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.NUMBER, 0, '12345'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes numbers with decimal places', function() {
    let lexer = new Lexer('12345.67');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.NUMBER, 0, '12345.67'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes numbers with a leading decimal', function() {
    let lexer = new Lexer('.67');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.NUMBER, 0, '.67'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes escaped backslashes as text', function() {
    let lexer = new Lexer('\\\\');
    let token = lexer.next();
    expect(token).to.deep.equal(new Token(TokenType.TEXT, 0, '\\\\'));
    expect(token.string.length).to.equal(2);
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes escaped backslashes surrounded by quotes', function() {
    let lexer = new Lexer("'\\\\'");
    expect(lexer.next()).to.deep.equal(new Token(TokenType.SINGLE_QUOTE, 0, "\'"));
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 1, "\\\\"));
    expect(lexer.next()).to.deep.equal(new Token(TokenType.SINGLE_QUOTE, 3, "\'"));
    expect(lexer.next()).to.deep.equal(null);
  });

  it('tokenizes escape sequences without consuming the following character', function() {
    let lexer = new Lexer('\\nP');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 0, '\n'));
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 2, 'P'));
    expect(lexer.next()).to.equal(null);
  });

  it('tokenizes known escape sequences', function() {
    let lexer = new Lexer('\\n');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 0, '\n'));
    expect(lexer.next()).to.equal(null);

    lexer = new Lexer('\\t');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 0, '\t'));
    expect(lexer.next()).to.equal(null);

    lexer = new Lexer('\\r');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 0, '\r'));
    expect(lexer.next()).to.equal(null);

    lexer = new Lexer("\\'");
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 0, '\''));
    expect(lexer.next()).to.equal(null);

    lexer = new Lexer('\\"');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 0, '\"'));
    expect(lexer.next()).to.equal(null);
  });

  it('treats backslashes before unknown escape sequences as literal', function() {
    let lexer = new Lexer('\\f');
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 0, '\\'));
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 1, 'f'));
    expect(lexer.next()).to.equal(null);
  });

  it('can peek at the next token without consuming it', function() {
    let lexer = new Lexer('ab');
    expect(lexer.peek()).to.deep.equal(new Token(TokenType.TEXT, 0, 'a'));
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 0, 'a'));
    expect(lexer.peek()).to.deep.equal(new Token(TokenType.TEXT, 1, 'b'));
    expect(lexer.next()).to.deep.equal(new Token(TokenType.TEXT, 1, 'b'));
    expect(lexer.peek()).to.equal(null);
    expect(lexer.next()).to.equal(null);
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
