import expect from 'expect';

const TokenType = require('../src/tokenType.ts').TokenType;
const Token = require('../src/token.ts').Token;

describe('Token', function() {
  it('has a useful toString', function() {
    let token = new Token(TokenType.TEXT, 0, 4, 'test');
    expect(token.toString()).toBe('Token{tokenType: TEXT, index: 0, endIndex: 4, string: \'test\'}');
  });
});
