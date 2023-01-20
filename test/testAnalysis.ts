import expect from 'expect';

import { analyze } from '../src/analysis';


/*
   
A way to sanity check these results is by actually executing snippets
repeatedly and counting the unique results. Of course this is only
useful with small branch counts!

let bmlScript = `
{c: (foo), (bar), (biz)}
{(x), (y)}
{@c: 0, 1 -> {(a), (b), (c)}, 2 -> ()}
`;

const ITERS = 1000;
let acc = new Set();
for (let i = 0; i < ITERS; i++) {
  acc.add(bml(bmlScript));
}
console.log(`After ${ITERS} iterations, I found ${acc.size} unique outputs`);
 */


describe('analyze', function() {
  it('counts an empty document', function() {
    let testString = ``;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(1));
  });

  it('counts a document with no forks', function() {
    let testString = `test`;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(1));
  });

  it('counts a document with a simple fork', function() {
    let testString = `test {(a), (b)}`;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(2));
  });

  it('counts a document with multiple top-level forks', function() {
    let testString = `test {(a), (b)} {(1), (2), (3)}`;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(6));
  });

  it('counts a document with a nested fork', function() {
    let testString = `test {(a), (b), {(c), (d), (e)}}`;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(5));
  });

  it('counts a document with a top-level fork containing an eval', function() {
    let testString = `test {(a), [insert('foo')]}`;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(2));
  });

  it('counts a document with a ref adding no branches', function() {
    let testString = `
test {id: (a), (b)}
{@id: 0 -> (foo), 1 -> (bar)}
`;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(2));
  });

  it('counts a document with a ref with a forking value', function() {
    let testString = `
test {id: (a), (b)}
{@id: 0 -> {(foo), (bar)}, 1 -> (bar)}
`;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(3));
  });

  it('counts a document with a ref with multiple forking values', function() {
    let testString = `
test {id: (a), (b)}
{@id: 0 -> {(foo), (bar), (biz)}, 1 -> {(a), (b)}}
`;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(2 + 2 + 1));
  });

  it('counts a document with a ref with fallback branches', function() {
    let testString = `
test {id: (a), (b), (c)}
{@id: 0 -> {(foo), (bar), (biz), (baz)}, {(1), (2), (3)}}
`;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(3 + 3 + (2 * 2)));
  });

  it('counts a document with a ref with explicit many-to-one mappings', function() {
    let testString = `
test {id: (a), (b), (c)}
{@id: 0, 1 -> {(foo), (bar), (biz)}, (fallback)}
`;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(3 + 2 + 2));
  });

  it('counts a bare ref as adding no branches', function() {
    let testString = `{id: (a), (b)} {@id}`;
    expect(analyze(testString).possibleOutcomes)
      .toEqual(BigInt(2));
  });

});
