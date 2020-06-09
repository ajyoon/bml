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
    let testString = 'hello {"beautiful" 60, "wonderful"} world!';
    let result = bml(testString);
    let possibleOutcomes = [
      'hello beautiful world!',
      'hello wonderful world!',
    ];
    if (possibleOutcomes.indexOf(result) === -1) {
      assert.fail(`Unexpected output: ${result}`);
    }
  });

  it('produces the exact same document when using a fixed random seed', function() {
    let testString = '' + fs.readFileSync(require.resolve('./randomSmokeTest.bml'));
    let firstResult = bml(testString, { randomSeed: 1234 });
    let secondResult = bml(testString, { randomSeed: 1234 });
    console.log(firstResult);
    expect(firstResult).to.equal(secondResult);
  });
});
