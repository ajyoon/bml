let expect = require('chai').expect;

let prettyPrinting = require('../src/prettyPrinting.js');


describe('prettyPrintArray', function() {
  it('prints an empty array as "[]"', function() {
    expect(prettyPrinting.prettyPrintArray([])).to.equal('[]');
  });

  it('prints a populated array with brackets and spaces', function() {
    expect(prettyPrinting.prettyPrintArray([1, 2])).to.equal('[1, 2]');
  });
});
