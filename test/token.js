let assert = require('assert');

let TokenType = require('../src/tokenType.js').TokenType;
let Token = require('../src/token.js').Token;

describe('Token', function() {
  it('has a useful toString', function() {
    let token = new Token(TokenType.TEXT, 0, 'test');
    assert.strictEqual(
      token.toString(),
      'Token{tokenType: TEXT, index: 0, string: \'test\'}');
  });
});
