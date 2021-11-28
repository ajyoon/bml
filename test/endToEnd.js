const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-string'));
const fs = require('fs');

const bml = require('../bml.js');

describe('bml', function() {
  it('can process a document without a prelude', function() {
    let testString = 'hello {(beautiful) 60, (wonderful)} world!';
    let result = bml(testString);
    let possibleOutcomes = [
      'hello beautiful world!\n',
      'hello wonderful world!\n',
    ];
    expect(result).to.be.oneOf(possibleOutcomes);
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
    expect(result).to.equal('foo!\n');
  });

  it('can process recursive rule choices', function() {
    let testString =
        `mode test {
            (recurse!) as (just kidding) 50, (outer {(inner 1), (inner 2)}) 50
        }
        {use test}
        recurse!
        `;
    let result = bml(testString);
    let possibleOutcomes = [
      'just kidding\n',
      'outer inner 1\n',
      'outer inner 2\n',
    ];
    expect(result).to.be.oneOf(possibleOutcomes);
  });

  it('respects the active mode on recursively rendered text', function() {
    let testString =
        `mode test {
            (foo) as (bar) 100
        }
        {use test}
        {(foo)}
        `;
    let result = bml(testString);
    expect(result).to.equal('bar\n');
  });

  it('can process recursive inline choices', function() {
    let testString = 'hello {(simple), ({(very ), ()}recursive)} world!';
    let result = bml(testString);
    let possibleOutcomes = [
      'hello simple world!\n',
      'hello recursive world!\n',
      'hello very recursive world!\n',
    ];
    expect(result).to.be.oneOf(possibleOutcomes);
  });

  it('can process refs, backrefs, and unused fallbacks', function() {
    let testString = '{Name: (Alice), (Bob)} went to the store. '
        + '{@Name: 0 -> (She), 1 -> (He), (unused fallback)} bought some tofu.';
    let result = bml(testString);
    let possibleOutcomes = [
      'Alice went to the store. She bought some tofu.\n',
      'Bob went to the store. He bought some tofu.\n'
    ];
    expect(result).to.be.oneOf(possibleOutcomes);
  });

  it('can process refs and backrefs with used fallbacks', function() {
    let testString = '{Name: (Alice), (Bob)} went to the store. '
        + '{@Name: 0 -> (She), (USED FALLBACK)} bought some tofu.';
    let result = bml(testString);
    let possibleOutcomes = [
      'Alice went to the store. She bought some tofu.\n',
      'Bob went to the store. USED FALLBACK bought some tofu.\n'
    ];
    expect(result).to.be.oneOf(possibleOutcomes);
  });

  it('allows refs and backrefs with empty strings', function() {
    // backref mapping is empty string
    expect(bml('{t: (a) 100, (b)} => {@t: 0 -> (), (not a)}')).to.equal('a =>\n');
    // backref mapping with empty string does not interfere with fallback
    expect(bml('{t: (a), (b) 100} => {@t: 0 -> (), (not a)}')).to.equal('b => not a\n');
    // fallback with empty string works too
    expect(bml('{t: (a), (b) 100} => {@t: 0 -> (not b), ()}')).to.equal('b =>\n');
  });

  it('correctly executes copy-backrefs', function() {
    let testString = '{Name: (Alice), (Bob)} {@Name}';
    let result = bml(testString);
    let possibleOutcomes = [
      'Alice Alice\n',
      'Bob Bob\n'
    ];
    expect(result).to.be.oneOf(possibleOutcomes);
  });

  it('outputs nothing for silent replacers, but tracks their results', function() {
    let testString = 'silent {#Name: (Alice), (Bob)} then referenced {@Name}';
    let result = bml(testString);
    let possibleOutcomes = [
      'silent  then referenced Alice\n',
      'silent  then referenced Bob\n'
    ];
    expect(result).to.be.oneOf(possibleOutcomes);
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
    expect(result).to.equal('foo\n');
  });

  it('tracks named choices made inside recursively rendered text', function() {
    let testString = `
      {({TestChoice: (foo)})} {@TestChoice}
    `;
    let result = bml(testString);
    expect(result).to.equal('foo foo\n');
  });

  it('produces the exact same document when using a fixed random seed', function() {
    const testString = '' + fs.readFileSync(require.resolve('./randomSmokeTest.bml'));
    let firstResult = bml(testString, { randomSeed: 1234 });
    let secondResult = bml(testString, { randomSeed: 1234 });
    expect(firstResult).to.equal(secondResult);
  });

  it('only renders markdown when set to', function() {
    let src = '# foo';
    expect(bml(src, {renderMarkdown: true}))
      .to.equal('<h1 id="foo">foo</h1>\n');
    expect(bml(src)).to.equal('# foo\n');
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
    expect(result).to.equal('<p>“testing”—</p>\n');
  });

  it('cleans whitespace by default but allows disabling', function() {
    let src = 'foo';
    expect(bml(src, {whitespaceCleanup: false})).to.equal('foo');
    expect(bml(src)).to.equal('foo\n');
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
  var hook;
  beforeEach(function(){
    hook = captureStream(process.stderr);
  });
  afterEach(function(){
    hook.unhook();
  });

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
    expect(hook.captured()).to.startsWith(
      'BML VERSION MISMATCH. bml source file specifies version nonsense');
  });

  it('does not warn on version when no version is present', function() {
    let testString = `testing 123`;
    bml(testString);
    expect(hook.captured()).to.equal('');
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
    expect(hook.captured()).to.equal('');
  });
});
