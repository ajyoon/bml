const expect = require('expect');
const fs = require('fs');

const _stringUtils = require('../src/stringUtils.js');
const lineAndColumnOf = _stringUtils.lineAndColumnOf;


describe('lineAndColumnOf', function() {
  it('should work at the first character', function() {
    expect(lineAndColumnOf('a', 0)).toEqual({line: 1, column: 0});
  });
  it('should count newline characters as the ending of a line', function() {
    expect(lineAndColumnOf('a\nb', 1)).toEqual({line: 1, column: 1});
  });
  it('should work at the start of a new line', function() {
    expect(lineAndColumnOf('a\nb', 2)).toEqual({line: 2, column: 0});
  });
  it('should work at the end of the string', function() {
    expect(lineAndColumnOf('a\nba', 3)).toEqual({line: 2, column: 1});
  });
});
