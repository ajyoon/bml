const expect = require('expect');
const fs = require('fs');

const bml = require('../src/bml.ts');
const { spyConsole } = require('./utils.js');

describe('bml', function() {
  it('can process a document without a prelude', function() {
    let testString = 'hello {(beautiful) 60, (wonderful)} world!';
    let result = bml(testString);
    let possibleOutcomes = [
      'hello beautiful world!\n',
      'hello wonderful world!\n',
    ];
    expect(possibleOutcomes).toEqual(expect.arrayContaining([result]));
  });

  it('can execute user-defined functions', function() {
    let testString = `
        eval {
            provide({
                foo: () => { return 'foo!' }
            });
        }
        {call foo}
    `;
    let result = bml(testString);
    expect(result).toBe('foo!\n');
  });

  it('can process recursive rule choices', function() {
    let testString =
        `mode test {
            (recurse!) as {(just kidding) 50, (outer {(inner 1), (inner 2)}) 50}
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
    expect(possibleOutcomes).toEqual(expect.arrayContaining([result]));
  });

  it('respects the active mode on recursively rendered text', function() {
    let testString =
        `mode test {
            (foo) as {(bar) 100}
        }
        {use test}
        {(foo)}
        `;
    expect(bml(testString).trim()).toBe('bar');
  });

  it('can process recursive inline choices', function() {
    let testString = 'hello {(simple), ({(very ), ()}recursive)} world!';
    let result = bml(testString);
    let possibleOutcomes = [
      'hello simple world!\n',
      'hello recursive world!\n',
      'hello very recursive world!\n',
    ];
    expect(possibleOutcomes).toEqual(expect.arrayContaining([result]));
  });

  it('can process refs, backrefs, and unused fallbacks', function() {
    let testString = '{Name: (Alice), (Bob)} went to the store. '
        + '{@Name: 0 -> (She), 1 -> (He), (unused fallback)} bought some tofu.';
    let result = bml(testString);
    let possibleOutcomes = [
      'Alice went to the store. She bought some tofu.\n',
      'Bob went to the store. He bought some tofu.\n'
    ];
    expect(possibleOutcomes).toEqual(expect.arrayContaining([result]));
  });

  it('can process refs and backrefs with used fallbacks', function() {
    let testString = '{Name: (Alice), (Bob)} went to the store. '
        + '{@Name: 0 -> (She), (USED FALLBACK)} bought some tofu.';
    let result = bml(testString);
    let possibleOutcomes = [
      'Alice went to the store. She bought some tofu.\n',
      'Bob went to the store. USED FALLBACK bought some tofu.\n'
    ];
    expect(possibleOutcomes).toEqual(expect.arrayContaining([result]));
  });

  it('allows refs and backrefs with empty strings', function() {
    // backref mapping is empty string
    expect(bml('{t: (a) 100, (b)} => {@t: 0 -> (), (not a)}')).toBe('a =>\n');
    // backref mapping with empty string does not interfere with fallback
    expect(bml('{t: (a), (b) 100} => {@t: 0 -> (), (not a)}')).toBe('b => not a\n');
    // fallback with empty string works too
    expect(bml('{t: (a), (b) 100} => {@t: 0 -> (not b), ()}')).toBe('b =>\n');
  });

  it('correctly executes copy-backrefs', function() {
    let testString = '{Name: (Alice), (Bob)} {@Name}';
    let result = bml(testString);
    let possibleOutcomes = [
      'Alice Alice\n',
      'Bob Bob\n'
    ];
    expect(possibleOutcomes).toEqual(expect.arrayContaining([result]));
  });

  it('outputs nothing for silent replacers, but tracks their results', function() {
    let testString = 'silent {#Name: (Alice), (Bob)} then referenced {@Name}';
    let result = bml(testString);
    let possibleOutcomes = [
      'silent then referenced Alice\n',
      'silent then referenced Bob\n'
    ];
    expect(possibleOutcomes).toEqual(expect.arrayContaining([result]));
  });

  /*
    This demonstrates a known bug where inline commands can't start with comments.
    It's part of a wider bug where inline commands generally don't handle comments
    consistently. Unfortunately the fix is not straightforward, since the inline
    command parser handles the various subtypes pretty differently, inconsistently
    using regexes and lexers. Regex approaches do not play well with comments and
    line breaks, and probably need to be replaced with lexers.
   */
  xit('detects inline choice blocks starting with comments', function() {
    let testString = `{
    // comment
    (foo)}`;
    let result = bml(testString);
    expect(result).toBe('foo\n');
  });

  it('tracks named choices made inside recursively rendered text', function() {
    let testString = `
      {({TestChoice: (foo)})} {@TestChoice}
    `;
    let result = bml(testString);
    expect(result).toBe('foo foo\n');
  });
  
  it('supports visual linebreaks', function() {
    expect(bml("foo\\\nbar")).toBe('foo bar\n');
    expect(bml("foo\\\n      bar")).toBe('foo bar\n');
    expect(bml("foo\\\n      {(bar)}")).toBe('foo bar\n');
  });
  
  it('supports comments in text', function() {
    let testString = `// a line comment
// another line comment
/* a block comment
   spanning multiple lines */
outer text
// another line comment
{(// a line comment inside a choice
// Comments can include string/command delimiters too )}
inner text /* a block comment inside a choice */
)}`;
    expect(bml(testString)).toBe('outer text\ninner text\n');
  });
  
  it('respects literal blocks', function() {
    let testString = `
        mode testMode {
            (foo) as {(bar)}
        }
        {use testMode}
        [[foo {(literal text should not interpreted)}]]
    `;
    expect(bml(testString).trim()).toBe('foo {(literal text should not interpreted)}');
  });

  it('produces the exact same document when using a fixed random seed', function() {
    const testString = '' + fs.readFileSync(require.resolve('./randomSmokeTest.bml'));
    let firstResult = bml(testString, { randomSeed: 1234 });
    let secondResult = bml(testString, { randomSeed: 1234 });
    expect(firstResult).toBe(secondResult);
  });

  it('only renders markdown when set to', function() {
    let src = '# foo';
    expect(bml(src, {renderMarkdown: true}))
      .toBe('<h1 id="foo">foo</h1>\n');
    expect(bml(src)).toBe('# foo\n');
  });

  it('respects markdown settings provided by user', function() {
    let testString = `
        eval {
            provide({
                settings: {
                    markdownSettings: {
                        smartypants: true,
                    }
                }
            });
        }
        "testing"---
    `;
    let result = bml(testString, {renderMarkdown: true});
    expect(result).toBe('<p>“testing”—</p>\n');
  });

  it('cleans whitespace by default but allows disabling', function() {
    let src = `
        eval {
            provide({
                settings: {
                    whitespaceCleanup: false
                }
            });
        }foo`;
    expect(bml('foo')).toBe('foo\n');
    expect(bml(src)).toBe('foo');
  });
  
  it('cleans punctuation placement by default but allows disabling', function() {
    let srcWithPuncCleanup = `
        eval {
            provide({
                settings: {
                    whitespaceCleanup: false,
                    capitalizationCleanup: false,
                    punctuationCleanup: true,
                }
            });
        }foo  . bar`;
    let srcWithoutPuncCleanup = `
        eval {
            provide({
                settings: {
                    whitespaceCleanup: false,
                    capitalizationCleanup: false,
                    punctuationCleanup: false,
                }
            });
        }foo  . bar`;
    expect(bml(srcWithPuncCleanup)).toBe('foo.   bar');
    expect(bml(srcWithoutPuncCleanup)).toBe('foo  . bar');
  });

  it('cleans punctuation before running markdown processing', function() {
    let src = 'foo\n\n.\n\nbar';
    expect(bml(src, {renderMarkdown: true})).toBe('<p>foo.</p>\n<p>bar</p>\n');
  });

  it('cleans punctuation before cleaning whitespace', function() {
    let src = 'foo\n\n\n.\n\n\n\nbar';
    expect(bml(src)).toBe('foo.\n\nBar\n');
  });
  
  it('corrects sentence capitalization by default but allows disabling', function() {
    let src = `
        eval {
            provide({
                settings: {
                    capitalizationCleanup: false,
                    whitespaceCleanup: false
                }
            });
        }test. test.`;
    expect(bml('test. test.')).toBe('test. Test.\n');
    expect(bml(src)).toBe('test. test.');
  });
});

// via https://stackoverflow.com/a/18543419/5615927
function captureStream(stream){
  var oldWrite = stream.write;
  var buf = '';
  stream.write = function(chunk, encoding, callback) {
    buf += chunk.toString(); // chunk is a String or Buffer
    oldWrite.apply(stream, arguments);
  };
  return {
    unhook: function unhook(){
     stream.write = oldWrite;
    },
    captured: function(){
      return buf;
    }
  };
}


describe('bml logging', function() {
  let spy = spyConsole();

  it('warns on version mismatch', function() {
    let testString = `
        eval {
            provide({
                settings: { version: 'nonsense' }
            });
        }
        testing 123
    `;
    bml(testString);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(spy.consoleWarn.mock.calls[0][0]).toContain(
      'BML VERSION MISMATCH. bml source file specifies version nonsense');

  });

  it('does not warn on version when no version is present', function() {
    let testString = `testing 123`;
    bml(testString);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('does not warn on recursive renders when top level has version', function() {
    const BML_VERSION = require('../package.json')['version'];
    let testString = `
        eval {
            settings = { version: '${BML_VERSION}' }
        }
        testing 123 {(sub-rendered text)}
    `;
    bml(testString);
    expect(console.error).not.toHaveBeenCalled();
  });
});
