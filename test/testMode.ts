import expect from 'expect';

import { Mode } from '../src/mode';
import { Rule } from '../src/rule';
import { Replacer } from '../src/replacer';


describe('Mode', function() {
  it('has a useful toString', function() {
    let mode = new Mode('test');
    mode.rules = [
      new Rule([], new Replacer([], 'foo', false)),
      new Rule([], new Replacer([], 'bar', false))
    ];
    expect(mode.toString()).toBe(
      "Mode{name: 'test', rules: [Rule{matchers: , replacer: Replacer{weights: , identifier: foo, isSilent: false}}, Rule{matchers: , replacer: Replacer{weights: , identifier: bar, isSilent: false}}]}"
    );
  });

  it('handles empty rule lists well in its toString', function() {
    let mode = new Mode('test');
    expect(mode.toString()).toBe('Mode{name: \'test\', rules: []}');
  });
});
