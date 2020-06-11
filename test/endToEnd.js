let assert = require('assert');
let expect = require('chai').expect;
let fs = require('fs');

let bml = require('../bml.js');

describe('bml', function() {
  it('doesn\'t explode when trying to process a sample document', function() {
    let testString = '' + fs.readFileSync(require.resolve('../sample.bml'));
    bml(testString);
    // If we make it here without an exception, we win
  });

  it('can process a document without a prelude', function() {
    let testString = 'hello {{beautiful} 60, {wonderful}} world!';
    let result = bml(testString);
    let possibleOutcomes = [
      'hello beautiful world!',
      'hello wonderful world!',
    ];
    if (possibleOutcomes.indexOf(result) === -1) {
      assert.fail(`Unexpected output: ${result}`);
    }
  });
  
  it('can process recursive rule choices', function() {
    let testString =
        `mode test {
            {recurse!} as {just kidding} 50, {outer {{inner 1}, {inner 2}}} 50
        }
        {use test}
        recurse!
        `;
    let result = bml(testString).trim();
    let possibleOutcomes = [
      'just kidding',
      'outer inner 1',
      'outer inner 2',
    ];
    if (possibleOutcomes.indexOf(result) === -1) {
      assert.fail(`Unexpected output: ${result}`);
    }
  });
  
  it('can process recursive inline choices', function() {
    let testString = 'hello {{simple}, {{{very }, {}}recursive}} world!';
    let result = bml(testString);
    let possibleOutcomes = [
      'hello simple world!',
      'hello recursive world!',
      'hello very recursive world!',
    ];
    if (possibleOutcomes.indexOf(result) === -1) {
      assert.fail(`Unexpected output: ${result}`);
    }
  });

  it('produces the exact same document when using a fixed random seed', function() {
    let testString = '' + fs.readFileSync(require.resolve('./randomSmokeTest.bml'));
    let firstResult = bml(testString, { randomSeed: 1234 });
    let secondResult = bml(testString, { randomSeed: 1234 });
    expect(firstResult).to.equal(secondResult);
  });
});
