const expect = require('expect');

const TokenType = require('../src/tokenType.js').TokenType;
const Token = require('../src/token.js').Token;

describe('Token', function() {
  it('has a useful toString', function() {
    let token = new Token(TokenType.TEXT, 0, 'test');
    expect(token.toString()).toBe('Token{tokenType: TEXT, index: 0, string: \'test\'}');
  });
});
