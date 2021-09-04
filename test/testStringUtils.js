const assert = require('assert');
const fs = require('fs');

const _stringUtils = require('../src/stringUtils.js');
const lineAndColumnOf = _stringUtils.lineAndColumnOf;


describe('lineAndColumnOf', function() {
  it('should work at the first character', function() {
    assert.deepStrictEqual(lineAndColumnOf('a', 0), {line: 1, column: 0});
  });
  it('should count newline characters as the ending of a line', function() {
    assert.deepStrictEqual(lineAndColumnOf('a\nb', 1), {line: 1, column: 1});
  });
  it('should work at the start of a new line', function() {
    assert.deepStrictEqual(lineAndColumnOf('a\nb', 2), {line: 2, column: 0});
  });
  it('should work at the end of the string', function() {
    assert.deepStrictEqual(lineAndColumnOf('a\nba', 3), {line: 2, column: 1});
  });
});
