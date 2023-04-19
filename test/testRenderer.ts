import expect from 'expect';
import * as tmp from 'tmp';
import fs from 'fs';

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

  // Document significant bug
  xit('preserves plaintext parentheses', function() {
    let testString = 'foo (bar)';
    expect(render(testString)).toEqual('Foo (bar)\n');
  })

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

  // Note this feature is currently unstable. The final structure of `forkMap`
  // is likely to change before stabilizing.
  it('Allows accessing the choice result map in eval blocks', function() {
    let testString = `
{foo: (bar), (biz)}
{[
let forkResult = bml.forkMap.get('foo');
insert('foo got index ' + forkResult.choiceIndex + ': ' + forkResult.renderedOutput);
]}
`;
    expect(render(testString)).toEqual('Bar\nfoo got index 0: bar\n');
  });

  it('Allows disabling eval execution', function() {
    let testString = `{[insert('foo')]}`;
    expect(() => render(testString, { allowEval: false }))
      .toThrow(EvalDisabledError);
  })

  function createTmpFile(contents: string): string {
    let path = tmp.fileSync().name;
    fs.writeFileSync(path, contents);
    return path;
  }

  it('Supports including a simple BML script', function() {
    let tmpScript = createTmpFile(`foo`)
    let testString = `
{[include('${tmpScript}')]}
`;
    expect(render(testString)).toEqual('Foo\n');
  });

  it('Retains eval bindings in includes', function() {
    let tmpScript = createTmpFile(`
      {[
        bind({
          test: 'foo'
        });
      ]}
    `);
    // Note that included bindings are NOT available within the same eval block.
    // To access the included binding 'test', a new eval block must be opened.
    // This is an internal limitation which could be fixed if needed.
    let testString = `
{[include('${tmpScript}')]}
{[insert(test)]}
`;
    expect(render(testString)).toEqual('Foo\n');
  });


  it('Retains choice references in includes', function() {
    let tmpScript = createTmpFile(`
      {#foo: (x), (y)}
    `);
    let testString = `
{[include('${tmpScript}')]}
{@foo}
{@foo: 0 -> (bar), 1 -> (biz)}
`;
    expect(render(testString)).toEqual('X\nbar\n');
  });

  it('Preserves RNG state around includes', function() {
    // I suspect this doesn't actually test RNG state restoration
    // but at least it pins some stability around the RNG behavior
    // before/during/after includes which contain rng use.
    let tmpScript = createTmpFile(`{foo: (x), (y)}`);
    let testString = `
{(a), (b), (c), (d), (e), (f), (g), (h), (i), (j), (k), (l), (m), (n), (o), (p)}
{[include('${tmpScript}')]}
{(a), (b), (c), (d), (e), (f), (g), (h), (i), (j), (k), (l), (m), (n), (o), (p)}
`;
    expect(render(testString)).toEqual('A\ny\nj\n');
  });
});

