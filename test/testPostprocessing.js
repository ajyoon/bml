const assert = require('assert');
const expect = require('chai').expect;

const postprocessing = require('../src/postprocessing.js');

describe('cleanWhitespace', function() {
  it('removes blank lines at start and end of string', function() {
    expect(postprocessing.whitespaceCleanup('\n\n\n\nfoo\n   \n'))
      .to.equal('foo\n');
  });
  
  it('collapses runs of more than 1 blank line into 1', function () {
    expect(postprocessing.whitespaceCleanup('foo\n\nbar\n\n\n\n\nbiz'))
      .to.equal('foo\n\nbar\n\nbiz\n');
  });

  it('removes trailing whitespace on every line', function() {
    expect(postprocessing.whitespaceCleanup('foo\n bar  \n    \n'))
      .to.equal('foo\n bar\n');
  });
  
  it('automatically inserts an EOF line break', function() {
    expect(postprocessing.whitespaceCleanup('foo'))
      .to.equal('foo\n');
  });
});
