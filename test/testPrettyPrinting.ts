import expect from 'expect';

import * as prettyPrinting from '../src/prettyPrinting';


describe('prettyPrintArray', function() {
  it('prints an empty array as "[]"', function() {
    expect(prettyPrinting.prettyPrintArray([])).toBe('[]');
  });

  it('prints a populated array with brackets and spaces', function() {
    expect(prettyPrinting.prettyPrintArray([1, 2])).toBe('[1, 2]');
  });
});
