import expect from 'expect';
import * as rand from '../src/rand';

import {
  EvalBindingError,
  EvalDisabledError
} from '../src/errors';

import { render } from '../src/renderer';


describe('render', function() {

  beforeEach(function() {
    rand.setRandomSeed(0); // pin seed for reproducibility
  });

  it('executes simple forks', function() {
    let testString = 'foo {(bar), (biz)}';
    expect(render(testString)).toEqual('Foo bar\n');
  });

  it('executes forks with eval blocks', function() {
    let testString = 'foo {[insert("eval")], (biz)}';
    expect(render(testString)).toEqual('Foo eval\n');
  });

  it('executes forks with weights', function() {
    let testString = 'foo {[insert("eval")], (biz) 99}';
    expect(render(testString)).toEqual('Foo biz\n');
  });

  it('executes nested forks', function() {
    let testString = 'foo {(bar {(nested branch), (other nested branch)}), (biz)}';
    expect(render(testString)).toEqual('Foo bar nested branch\n');
  });

  it('supports bare references', function() {
    let testString = 'foo {id: (bar), (biz)} {@id}';
    expect(render(testString)).toEqual('Foo bar bar\n');
  });

  it('supports silent fork references', function() {
    let testString = 'foo {#id: (bar), (biz)} {@id}';
    expect(render(testString)).toEqual('Foo bar\n');
  });

  it('supports mapped references', function() {
    let testString = 'foo {id: (bar), (biz)} {@id: 0 -> (buzz), (bazz)}';
    expect(render(testString)).toEqual('Foo bar buzz\n');
  });

  it('skips line break after silent fork on its own line', function() {
    let testString = 'foo\n{#id: (bar)}\nbiz';
    expect(render(testString)).toEqual('Foo\nbiz\n');
  });

  it('errors on duplicate eval bindings', function() {
    let testString = `
{[bind({foo: 123})]}
{[bind({foo: 456})]}
`;
    expect(() => render(testString)).toThrow(EvalBindingError);
  });

  it('Allows a value bound in one eval block to be accessed in others', function() {
    let testString = `
{[bind({foo: 123})]}
{[insert(foo)]}
`;
    expect(render(testString)).toEqual('123\n');
  });

  it('Allows a value bound in one eval block to be mutated in others', function() {
    let testString = `
{[bind({foo: 123})]}
{[foo = 456;]}
{[insert(foo)]}
`;
    expect(render(testString)).toEqual('456\n');
  });

  it('Allows calling insert within bound functions', function() {
    let testString = `
{[
    bind({
        someValue: 'bar',
        myFunc: (value) => {
            insert(value);
        }
    });
]}
{[myFunc('foo')]}
{[myFunc(someValue)]}
`;
    expect(render(testString)).toEqual('Foo\nbar\n');
  });

  it('Allows disabling eval execution', function() {
    let testString = `{[insert('foo')]}`;
    expect(() => render(testString, { allowEval: false }))
      .toThrow(EvalDisabledError);
  })
});
