import expect from 'expect';

import { Lexer } from '../src/lexer';
import { Token } from '../src/token';
import { TokenType } from '../src/tokenType';


describe('Lexer', function() {
  it('doesn\'t explode with an empty string', function() {
    let lexer = new Lexer('');
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes new lines', function() {
    let lexer = new Lexer('\n');
    expect(lexer.next()).toEqual(new Token(TokenType.NEW_LINE, 0, 1, '\n'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes CLRF new lines', function() {
    let lexer = new Lexer('\r\n');
    expect(lexer.next()).toEqual(new Token(TokenType.NEW_LINE, 0, 2, '\r\n'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes visual newlines dumbly', function() {
    let lexer = new Lexer('\\\n   test');
    expect(lexer.next()).toEqual(new Token(TokenType.VISUAL_NEW_LINE, 0, 2, ' '));
    expect(lexer.next()).toEqual(new Token(TokenType.WHITESPACE, 2, 5, '   '));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 5, 6, 't'));
  });

  it('tokenizes visual CRLF newlines dumbly', function() {
    let lexer = new Lexer('\\\r\n   test');
    expect(lexer.next()).toEqual(new Token(TokenType.VISUAL_NEW_LINE, 0, 3, ' '));
    expect(lexer.next()).toEqual(new Token(TokenType.WHITESPACE, 3, 6, '   '));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 6, 7, 't'));
  });

  it('tokenizes spaces and tabs as WHITESPACE', function() {
    let lexer = new Lexer(' ');
    expect(lexer.next()).toEqual(new Token(TokenType.WHITESPACE, 0, 1, ' '));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer('\t');
    expect(lexer.next()).toEqual(new Token(TokenType.WHITESPACE, 0, 1, '\t'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes comments', function() {
    let lexer = new Lexer('//');
    expect(lexer._determineNextRaw()).toEqual(new Token(TokenType.COMMENT, 0, 2, '//'));
  });

  it('tokenizes block comment openings', function() {
    let lexer = new Lexer('/*');
    expect(lexer._determineNextRaw()).toEqual(new Token(TokenType.OPEN_BLOCK_COMMENT, 0, 2, '/*'));
  });

  it('tokenizes block comment closings', function() {
    let lexer = new Lexer('*/');
    expect(lexer.next()).toEqual(new Token(TokenType.CLOSE_BLOCK_COMMENT, 0, 2, '*/'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes slashes', function() {
    let lexer = new Lexer('/');
    expect(lexer.next()).toEqual(new Token(TokenType.SLASH, 0, 1, '/'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes single quotes', function() {
    let lexer = new Lexer('\'');
    expect(lexer.next()).toEqual(new Token(TokenType.SINGLE_QUOTE, 0, 1, '\''));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes double quotes', function() {
    let lexer = new Lexer('"');
    expect(lexer.next()).toEqual(new Token(TokenType.DOUBLE_QUOTE, 0, 1, '"'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes backticks', function() {
    let lexer = new Lexer('`');
    expect(lexer.next()).toEqual(new Token(TokenType.BACKTICK, 0, 1, '`'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes open paren', function() {
    let lexer = new Lexer('(');
    expect(lexer.next()).toEqual(new Token(TokenType.OPEN_PAREN, 0, 1, '('));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes close paren', function() {
    let lexer = new Lexer(')');
    expect(lexer.next()).toEqual(new Token(TokenType.CLOSE_PAREN, 0, 1, ')'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes open brace', function() {
    let lexer = new Lexer('{');
    expect(lexer.next()).toEqual(new Token(TokenType.OPEN_BRACE, 0, 1, '{'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes close brace', function() {
    let lexer = new Lexer('}');
    expect(lexer.next()).toEqual(new Token(TokenType.CLOSE_BRACE, 0, 1, '}'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes commas', function() {
    let lexer = new Lexer(',');
    expect(lexer.next()).toEqual(new Token(TokenType.COMMA, 0, 1, ','));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes colons', function() {
    let lexer = new Lexer(':');
    expect(lexer.next()).toEqual(new Token(TokenType.COLON, 0, 1, ':'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes at', function() {
    let lexer = new Lexer('@');
    expect(lexer.next()).toEqual(new Token(TokenType.AT, 0, 1, '@'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes pipe', function() {
    let lexer = new Lexer('|');
    expect(lexer.next()).toEqual(new Token(TokenType.PIPE, 0, 1, '|'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes arrow', function() {
    let lexer = new Lexer('->');
    expect(lexer.next()).toEqual(new Token(TokenType.ARROW, 0, 2, '->'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes open double bracket', function() {
    let lexer = new Lexer('[[');
    expect(lexer.next()).toEqual(new Token(TokenType.OPEN_DOUBLE_BRACKET, 0, 2, '[['));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes close double bracket', function() {
    let lexer = new Lexer(']]');
    expect(lexer.next()).toEqual(new Token(TokenType.CLOSE_DOUBLE_BRACKET, 0, 2, ']]'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes the keyword "call"', function() {
    let lexer = new Lexer('call');
    expect(lexer.next()).toEqual(new Token(TokenType.KW_CALL, 0, 4, 'call'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes the keyword "eval"', function() {
    let lexer = new Lexer('eval');
    expect(lexer.next()).toEqual(new Token(TokenType.KW_EVAL, 0, 4, 'eval'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes the keyword "mode"', function() {
    let lexer = new Lexer('mode');
    expect(lexer.next()).toEqual(new Token(TokenType.KW_MODE, 0, 4, 'mode'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes the keyword "use"', function() {
    let lexer = new Lexer('use');
    expect(lexer.next()).toEqual(new Token(TokenType.KW_USE, 0, 3, 'use'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes the keyword "match"', function() {
    let lexer = new Lexer('match');
    expect(lexer.next()).toEqual(new Token(TokenType.KW_MATCH, 0, 5, 'match'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes misc characters as individual text tokens', function() {
    let lexer = new Lexer('ab%');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 1, 'a'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 1, 2, 'b'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 2, 3, '%'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes numbers', function() {
    let lexer = new Lexer('12345');
    expect(lexer.next()).toEqual(new Token(TokenType.NUMBER, 0, 5, '12345'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes numbers with decimal places', function() {
    let lexer = new Lexer('12345.67');
    expect(lexer.next()).toEqual(new Token(TokenType.NUMBER, 0, 8, '12345.67'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes numbers with a leading decimal', function() {
    let lexer = new Lexer('.67');
    expect(lexer.next()).toEqual(new Token(TokenType.NUMBER, 0, 3, '.67'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes escape sequences without consuming the following character', function() {
    let lexer = new Lexer('\\nP');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 2, '\n'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 2, 3, 'P'));
    expect(lexer.next()).toBeNull();
  });

  it('tokenizes known escape sequences', function() {
    let lexer;

    lexer = new Lexer('\\\\');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 2, '\\'));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer('\\/');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 2, '/'));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer('\\[');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 2, '['));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer('\\{');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 2, '{'));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer('\\n');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 2, '\n'));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer('\\t');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 2, '\t'));
    expect(lexer.next()).toBeNull();

    lexer = new Lexer('\\r');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 2, '\r'));
    expect(lexer.next()).toBeNull();
  });

  it('treats backslashes before unknown escape sequences as literal', function() {
    let lexer = new Lexer('\\f');
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 1, '\\'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 1, 2, 'f'));
    expect(lexer.next()).toBeNull();
  });

  it('can peek at the next token without consuming it', function() {
    let lexer = new Lexer('ab');
    expect(lexer.peek()).toEqual(new Token(TokenType.TEXT, 0, 1, 'a'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 0, 1, 'a'));
    expect(lexer.peek()).toEqual(new Token(TokenType.TEXT, 1, 2, 'b'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 1, 2, 'b'));
    expect(lexer.peek()).toBeNull();
    expect(lexer.next()).toBeNull();
  });

  it('automatically skips line comments', function() {
    let lexer = new Lexer('//foo\ntest');
    expect(lexer.peek()).toEqual(new Token(TokenType.TEXT, 6, 7, 't'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 6, 7, 't'));
  });

  it('skips over sequential line comments', function() {
    let lexer = new Lexer('//foo\n//bar\ntest');
    expect(lexer.peek()).toEqual(new Token(TokenType.TEXT, 12, 13, 't'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 12, 13, 't'));
  });

  it('converts block comments into a single white space', function() {
    let lexer = new Lexer('/* foo \n\n  bar    */test');
    expect(lexer.peek()).toEqual(new Token(TokenType.WHITESPACE, 19, 20, ' '));
    expect(lexer.next()).toEqual(new Token(TokenType.WHITESPACE, 19, 20, ' '));
    expect(lexer.peek()).toEqual(new Token(TokenType.TEXT, 20, 21, 't'));
    expect(lexer.next()).toEqual(new Token(TokenType.TEXT, 20, 21, 't'));
  });

  it('can skip to the next token satisfying a predicate', function() {
    let lexer = new Lexer('abc');
    expect(lexer.nextSatisfying((t) => t.str === 'b')).toEqual(new Token(TokenType.TEXT, 1, 2, 'b'));
  });

  it('can skip to the next non-whitespace (or comment) token', function() {
    let lexer = new Lexer('   \n\n test');
    expect(lexer.nextNonWhitespace()).toEqual(new Token(TokenType.TEXT, 6, 7, 't'));
  });
});