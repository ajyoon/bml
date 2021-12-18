const expect = require('expect');

const postprocessing = require('../src/postprocessing.ts');


describe('cleanWhitespace', function() {
  it('removes blank lines at start and end of string', function() {
    expect(postprocessing.whitespaceCleanup('\n\n\n\nfoo\n   \n')).toBe('foo\n');
  });

  it('collapses runs of more than 1 blank line into 1', function () {
    expect(postprocessing.whitespaceCleanup('foo\n\nbar\n\n\n\n\nbiz')).toBe('foo\n\nbar\n\nbiz\n');
  });

  it('removes trailing whitespace on every line', function() {
    expect(postprocessing.whitespaceCleanup('foo\n bar  \n    \n')).toBe('foo\n bar\n');
  });

  it('automatically inserts an EOF line break', function() {
    expect(postprocessing.whitespaceCleanup('foo')).toBe('foo\n');
  });

  it('doesnt insert a redundant EOF line break when one already exists', function() {
    expect(postprocessing.whitespaceCleanup('foo\n')).toBe('foo\n');
  });

  it('preserves leading whitespace on every line', function() {
    expect(postprocessing.whitespaceCleanup(' foo')).toBe(' foo\n');
  });

  it('collapses runs of more than 1 whitespace in the middle of a line', function() {
    expect(postprocessing.whitespaceCleanup('  foo     bar')).toBe('  foo bar\n');
  });
});

describe('punctuationCleanup', function() {
  it('snaps punctuation left', function() {
    expect(postprocessing.punctuationCleanup('test . ')).toBe('test.  ');
    expect(postprocessing.punctuationCleanup('test , ')).toBe('test,  ');
    expect(postprocessing.punctuationCleanup('test : ')).toBe('test:  ');
    expect(postprocessing.punctuationCleanup('test ; ')).toBe('test;  ');
    expect(postprocessing.punctuationCleanup('test ! ')).toBe('test!  ');
    expect(postprocessing.punctuationCleanup('test ? ')).toBe('test?  ');
  });

  it('snaps groups of punctuation left together', function() {
    expect(postprocessing.punctuationCleanup('test ?! ')).toBe('test?!  ');
  });

  it('preserves whatever whitespace comes before', function() {
    expect(postprocessing.punctuationCleanup('test  \t?! ')).toBe('test?!  \t ');
  });

  it('corrects across newlines too', function() {
    expect(postprocessing.punctuationCleanup('test  \n\n. ')).toBe('test.  \n\n ');
  });
});
