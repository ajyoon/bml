import expect from 'expect';
import * as tmp from 'tmp';
import fs from 'fs';
import path from 'path';

import * as rand from '../src/rand';
import {
  EvalBindingError,
  EvalDisabledError
} from '../src/errors';
import { render } from '../src/renderer';


describe('render', function() {
  let consoleWarnMock: any;

  beforeEach(function() {
    rand.setRandomSeed(0); // pin seed for reproducibility
    consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(function() {
    consoleWarnMock.mockRestore();
  });

  it('executes simple forks', function() {
    let testString = 'foo {(bar), (biz)}';
    expect(render(testString, null)).toEqual('Foo bar\n');
  });

  it('executes forks with eval blocks', function() {
    let testString = 'foo {[insert("eval")], (biz)}';
    expect(render(testString, null)).toEqual('Foo eval\n');
  });

  it('executes forks with weights', function() {
    let testString = 'foo {[insert("eval")], (biz) 99}';
    expect(render(testString, null)).toEqual('Foo biz\n');
  });

  it('executes nested forks', function() {
    let testString = 'foo {(bar {(nested branch), (other nested branch)}), (biz)}';
    expect(render(testString, null)).toEqual('Foo bar nested branch\n');
  });

  it('supports bare references', function() {
    let testString = 'foo {id: (bar), (biz)} {@id}';
    expect(render(testString, null)).toEqual('Foo bar bar\n');
  });

  it('supports silent fork references', function() {
    let testString = 'foo {#id: (bar), (biz)} {@id}';
    expect(render(testString, null)).toEqual('Foo bar\n');
  });

  it('emits nothing for lines containing only silent forks', function() {
    let testString = `
{[bind({settings: {whitespaceCleanup: false}})]}
foo
{#id: (bar), (biz)}
{#id2:
  (baz), (buz)
}
biz
`;
    expect(render(testString, null)).toEqual('\n\nFoo\nbiz\n');
  });


  it('supports mapped references', function() {
    let testString = 'foo {id: (bar), (biz)} {@id: 0 -> (buzz), (bazz)}';
    expect(render(testString, null)).toEqual('Foo bar buzz\n');
  });

  it('supports re-executing references', function() {
    let testString = 'foo {id: (bar), (biz)} {@!id} {@!id} {@!id} {@!id} {@!id}';
    expect(render(testString, null)).toEqual('Foo bar bar biz biz biz bar\n');
  });

  it('updates the executed fork map on re-executing references', function() {
    let testString = `
{id: (foo), (bar)} {@id: 0 -> (fff), 1 -> (bbb)}
{@!id} {@id: 0 -> (fff), 1 -> (bbb)}
{@!id} {@id: 0 -> (fff), 1 -> (bbb)}
{@!id} {@id: 0 -> (fff), 1 -> (bbb)}
`;
    expect(render(testString, null)).toEqual('Foo fff\nfoo fff\nbar bbb\nbar bbb\n');
  });

  it('supports initial set fork declarations', function() {
    let testString = 'foo {$id: (bar), (biz)}';
    expect(render(testString, null)).toEqual('Foo bar\n');
  });

  it('supports initial silent set fork declarations', function() {
    let testString = 'foo {#$id: (bar), (biz)}';
    expect(render(testString, null)).toEqual('Foo\n');
  });

  it('supports re-executing set forks', function() {
    let testString = '{$id: (A), (B), (C), (D)} {@!id} {@!id} {@!id}';
    expect(render(testString, null)).toEqual('A B D C\n');
  });

  it('supports re-executing silent set forks', function() {
    // Note that silent set forks are *not* immediately executed,
    // so the initial declaration does not cause a set member to be exhausted
    let testString = '{#$id: (A), (B), (C), (D)} {@!id} {@!id} {@!id} {@!id}';
    expect(render(testString, null)).toEqual(' A B D C\n');
  });

  it('resets weights on exhausted sets', function() {
    let testString = '{#$id: (A), (B), (C), (D)} {@!id} {@!id} {@!id} {@!id} {@!id}';
    expect(render(testString, null)).toEqual(' A B D C D\n');
    expect(consoleWarnMock).toBeCalled();
  });

  it('allows mapping on set forks', function() {
    let testString = '{#$id: (A), (B)} {@!id} {@!id} {@id: 0 -> (a), 1 -> (b)}';
    expect(render(testString, null)).toEqual(' A B b\n');
  });

  it('gracefully warns when trying to map unexecuted silent set forks', function() {
    let testString = '{#$id: (A), (B), (C), (D)} {@id: 0 -> (foo)}';
    expect(render(testString, null)).toEqual('');
    expect(consoleWarnMock).toBeCalled();
  });

  it('preserves plaintext parentheses', function() {
    let testString = 'foo (bar)';
    expect(render(testString, null)).toEqual('Foo (bar)\n');
  });

  it('preserves plaintext parentheses in fork text', function() {
    let testString = 'foo (bar {((biz))})';
    expect(render(testString, null)).toEqual('Foo (bar (biz))\n');
  });


  it('skips line break after silent fork on its own line', function() {
    let testString = 'foo\n{#id: (bar)}\nbiz';
    expect(render(testString, null)).toEqual('Foo\nbiz\n');
  });

  it('errors on duplicate eval bindings', function() {
    let testString = `
{[bind({foo: 123})]}
{[bind({foo: 456})]}
`;
    expect(() => render(testString, null)).toThrow(EvalBindingError);
  });

  it('Allows a value bound in one eval block to be accessed in others', function() {
    let testString = `
{[bind({foo: 123})]}
{[insert(foo)]}
`;
    expect(render(testString, null)).toEqual('123\n');
  });

  it('Allows a value bound in one eval block to be mutated in others', function() {
    let testString = `
{[bind({foo: 123})]}
{[foo = 456;]}
{[insert(foo)]}
`;
    expect(render(testString, null)).toEqual('456\n');
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
    expect(render(testString, null)).toEqual('Foo\nbar\n');
  });

  // Note that in-eval ref lookups are currently unstable
  it('Allows performing detailed ref lookups in eval blocks', function() {
    let testString = `
{foo: (bar), (biz)}
{[
let forkResult = bml.refDetail('foo');
insert('foo got index ' + forkResult.choiceIndex + ': ' + forkResult.renderedOutput);
]}
`;
    expect(render(testString, null)).toEqual('Bar\nfoo got index 0: bar\n');
  });

  it('Allows performing simple ref lookups in eval blocks', function() {
    let testString = `
{foo: (bar), (biz)}
{[
let forkResult = bml.ref('foo');
insert('foo got ' + forkResult);
]}
`;
    expect(render(testString, null)).toEqual('Bar\nfoo got bar\n');
  });

  it('Dynamically loads fork map in evals', function() {
    let testString = `
{#foo: (x)}
{[
  bind({
    test: (id) => {
      insert(bml.ref(id));
    }
  });
]}
{#foo: (a)}
{[test('foo')]}
`;
    expect(render(testString, null)).toEqual('A\n');
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
    let tmpDir = path.dirname(tmpScript);
    let tmpFilename = path.basename(tmpScript);
    let testString = `
{[include('${tmpFilename}')]}
`;

    expect(render(testString, { workingDir: tmpDir })).toEqual('Foo\n');
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
    expect(render(testString, null)).toEqual('Foo\n');
  });

  // This documents a known issue: functions bound inside included evals
  // don't share the same eval context as the outer BML context, and so
  // things like calling `insert` inside a bound function or accessing the
  // ref map don't work as expected. I'm unsure what's the best way to handle this,
  // so for now I'm leaving the behavior in place and pinning it with this test.
  it('Does not support inserts in include-bound functions', function() {
    let tmpScript = createTmpFile(`
      {[
        bind({
          test: () => { insert('foo') }
        });
      ]}
    `);
    // Note that included bindings are NOT available within the same eval block.
    // To access the included binding 'test', a new eval block must be opened.
    // This is an internal limitation which could be fixed if needed.
    let testString = `
{[include('${tmpScript}')]}
{[test()]}
`;
    expect(render(testString, null)).toEqual('');
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
    expect(render(testString, null)).toEqual('X\nbar\n');
  });

  it('Allows repeated includes', function() {
    let tmpScript = createTmpFile(`
      {#foo: (x), (y)}
      {[
        bind({
          test: () => { return 'bar'; }
        });
      ]}
    `);
    let testString = `
{[include('${tmpScript}')]}
{[include('${tmpScript}')]}
`;
    expect(render(testString, null)).toEqual('');
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
    expect(render(testString, null)).toEqual('A\ny\nj\n');
  });
});

