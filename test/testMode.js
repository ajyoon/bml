const expect = require('expect');

const Mode = require('../src/mode.js').Mode;


describe('Mode', function() {
  it('has a useful toString', function() {
    let mode = new Mode('test');
    mode.rules = [1, 2];
    expect(mode.toString()).toBe('Mode{name: \'test\', rules: [1, 2]}');
  });

  it('handles empty rule lists well in its toString', function() {
    let mode = new Mode('test');
    expect(mode.toString()).toBe('Mode{name: \'test\', rules: []}');
  });
});
