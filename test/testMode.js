let expect = require('chai').expect;

let Mode = require('../src/mode.js').Mode;


describe('Mode', function() {
  it('has a useful toString', function() {
    mode = new Mode('test');
    mode.rules = [1, 2];
    expect(mode.toString()).to.equal('Mode{name: \'test\', rules: [1, 2]}');
  });

  it('handles empty rule lists well in its toString', function() {
    mode = new Mode('test');
    expect(mode.toString()).to.equal('Mode{name: \'test\', rules: []}');
  });
});
