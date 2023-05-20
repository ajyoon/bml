import expect from 'expect';
import * as postprocessing from '../src/postprocessing';


describe('cleanWhitespace', function() {
  it('removes blank lines at start and end of string', function() {
    expect(postprocessing.whitespaceCleanup('\n\n\n\nfoo\n   \n')).toBe('foo\n');
  });

  it('collapses runs of more than 1 blank line into 1', function() {
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

  it('does nothing on correctly written text', function() {
    let src = 'test, test:  test; test! test? ';
    expect(postprocessing.punctuationCleanup(src)).toBe(src);
  });
});

describe('capitalizationCleanup', function() {
  it('Does nothing on well-capitalized text', function() {
    let src = 'Test. Test 2! 123 test? Test';
    expect(postprocessing.capitalizationCleanup(src)).toBe(src);
  });

  it('Capitalizes plain ASCII characters', function() {
    let src = 'test. test.';
    expect(postprocessing.capitalizationCleanup(src)).toBe('Test. Test.');
  });

  it('Capitalizes extended latin characters', function() {
    let src = 'test! ä';
    expect(postprocessing.capitalizationCleanup(src)).toBe('Test! Ä');
  });

  it('Works across line breaks', function() {
    let src = 'test. \ntest.';
    expect(postprocessing.capitalizationCleanup(src)).toBe('Test. \nTest.');
  });
});

describe('correctIndefiniteArticles', function() {
  function testCase(input: string, output: string) {
    expect(postprocessing.correctIndefiniteArticles(input)).toBe(output);
  }

  it('Leaves correct cases intact', function() {
    testCase('a dog', 'a dog');
    testCase('an apple', 'an apple');
    testCase('a union', 'a union');
    testCase('a 10', 'a 10');
    testCase('an 8', 'an 8');
    testCase('a UFO', 'a UFO');
  });

  it('Corrects incorrect cases', function() {
    testCase('an dog', 'a dog');
    testCase('a apple', 'an apple');
    testCase('an union', 'a union');
    testCase('an 10', 'a 10');
    testCase('a 8', 'an 8');
    testCase('an UFO', 'a UFO');
  });

  it('Corrects multiple cases in a string', function() {
    testCase('an dog\nand a apple', 'a dog\nand an apple');
  });

  it('Preserves capitalization schemes', function() {
    testCase('An dog', 'A dog');
    testCase('AN dog', 'A dog');
    testCase('A apple', 'An apple');
    testCase('a apple', 'an apple');
    testCase('AN apple', 'AN apple');
  });

  it('Works on words with diacritics', function() {
    testCase('an jalapeño', 'a jalapeño');
  })

  it('Doesnt act on words spelled with article-like endings', function() {
    // Regression test
    testCase('can dog', 'can dog');
  });
});
