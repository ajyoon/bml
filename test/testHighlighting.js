const fs = require('fs');

const expect = require('chai').expect;

const highlighting = require('../src/highlighting.js');

const INPUT_PATH = './test/data/highlightInput.bml';
const EXPECTED_OUTPUT_PATH = './test/data/highlightOutput.html';

function generateExpectedOutput() { // eslint-disable-line
  const sampleInput = '' + fs.readFileSync(INPUT_PATH);
  const highlighted = highlighting.highlightBml(sampleInput);
  fs.writeFileSync(EXPECTED_OUTPUT_PATH, highlighted);
}

describe('highlighting', function() {
  it('highlights a bml sample correctly', function() {
    // When changing the behavior of syntax highlighting,
    // confirm with a browser that the new behavior is correct,
    // uncomment this line to regenerate the expected output,
    // and comment it again

    //generateExpectedOutput();

    const sampleInput = '' + fs.readFileSync(INPUT_PATH);
    const highlighted = highlighting.highlightBml(sampleInput);
    const expectedOutput = '' + fs.readFileSync(EXPECTED_OUTPUT_PATH);
    expect(highlighted).to.equal(expectedOutput);
  });
});
