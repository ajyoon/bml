const assert = require('assert');
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-string'));
const fs = require('fs');

const bml = require('../bml.js');

describe('bml', function() {
  it('doesn\'t explode when trying to process a sample document', function() {
    const testString = '' + fs.readFileSync(require.resolve('../sample.bml'));
    bml(testString);
    // If we make it here without an exception, we win
  });

  it('can process a document without a prelude', function() {
    let testString = 'hello {(beautiful) 60, (wonderful)} world!';
    let result = bml(testString);
    let possibleOutcomes = [
      'hello beautiful world!\n',
      'hello wonderful world!\n',
    ];
    if (possibleOutcomes.indexOf(result) === -1) {
      assert.fail(`Unexpected output: ${result}`);
    }
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
    if (possibleOutcomes.indexOf(result) === -1) {
      assert.fail(`Unexpected output: ${result}`);
    }
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
    if (possibleOutcomes.indexOf(result) === -1) {
      assert.fail(`Unexpected output: ${result}`);
    }
  });
  
  it('can process refs, backrefs, and unused fallbacks', function() {
    let testString = '{Name: (Alice), (Bob)} went to the store. '
        + '{@Name: 0 -> (She), 1 -> (He), (unused fallback)} bought some tofu.';
    let result = bml(testString);
    let possibleOutcomes = [
      'Alice went to the store. She bought some tofu.\n',
      'Bob went to the store. He bought some tofu.\n'
    ];
    if (possibleOutcomes.indexOf(result) === -1) {
      assert.fail(`Unexpected output: ${result}`);
    }
  });
  
  it('can process refs and backrefs with used fallbacks', function() {
    let testString = '{Name: (Alice), (Bob)} went to the store. '
        + '{@Name: 0 -> (She), (USED FALLBACK)} bought some tofu.';
    let result = bml(testString);
    let possibleOutcomes = [
      'Alice went to the store. She bought some tofu.\n',
      'Bob went to the store. USED FALLBACK bought some tofu.\n'
    ];
    if (possibleOutcomes.indexOf(result) === -1) {
      assert.fail(`Unexpected output: ${result}`);
    }
  });
  
  it('correctly executes copy-backrefs', function() {
    let testString = '{Name: (Alice), (Bob)} {@Name}';
    let result = bml(testString);
    let possibleOutcomes = [
      'Alice Alice\n',
      'Bob Bob\n'
    ];
    if (possibleOutcomes.indexOf(result) === -1) {
      assert.fail(`Unexpected output: ${result}`);
    }
  });
  
  it('outputs nothing for silent replacers, but tracks their results', function() {
    let testString = 'silent {#Name: (Alice), (Bob)} then referenced {@Name}';
    let result = bml(testString);
    let possibleOutcomes = [
      'silent  then referenced Alice\n',
      'silent  then referenced Bob\n'
    ];
    if (possibleOutcomes.indexOf(result) === -1) {
      assert.fail(`Unexpected output: ${result}`);
    }
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
    expect(bml('eval { settings = { renderMarkdown: true }; }\n# foo'))
      .to.equal('<h1 id="foo">foo</h1>\n');
    expect(bml('# foo')) .to.equal('# foo\n');
  });
  
  it('cleans whitespace by default but allows disabling', function() {
    expect(bml('eval { settings = { whitespaceCleanup: false }; }\nfoo'))
      .to.equal('foo');
    expect(bml('foo')) .to.equal('foo\n');
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
            settings = { version: 'nonsense' }
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
