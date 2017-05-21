var assert = require('assert');
var fs = require('fs');
var bml = require('bml');


bml._private.__unpackPrivates();


describe('normalizeWeights', function() {
  it('should do nothing when all weights sum to 100', function() {
    var weights = [{option: 1, chance: 40}, {option: 1, chance: 60}];
    assert.deepEqual(bml.normalizeWeights(weights), weights);
  });
});

describe('bmlSettings', function() {
  it('should handle replacing all fields', function() {
    bml.changeSettings({
      renderMarkdown: true,
      contextSize: 1000
    });
    assert.equal(true, bml.settings.renderMarkdown);
    assert.equal(1000, bml.settings.contextSize);
  });
});

describe('extractJavascript', function() {
  it('should ignore braces in inline comments', function() {
    var testString = '012{//}\n}end';
    assert.equal(bml.extractJavascript(testString, 3), testString.indexOf('end'));
  });
  it('should ignore braces in block comments', function() {
    var testString = '012{4/*\n}*/}end';
    assert.equal(bml.extractJavascript(testString, 3), testString.indexOf('end'));
  });
  it('should ignore braces in single-quote string literals', function() {
    var testString = "012{'}'}end";
    assert.equal(bml.extractJavascript(testString, 3), testString.indexOf('end'));
  });
  it('should error on newline before matching single-quote', function() {
    var testString = "012{'\n";
    try {
      bml.extractJavascript(testString, 3);
      assert(false, 'error expected');
    } catch (e) {
      assert.equal(true, e.message.startsWith('Syntax error'));
    }
  });
  it('should ignore braces in double-quote string literals', function() {
    var testString = '012{"}"}end';
    assert.equal(bml.extractJavascript(testString, 3), testString.indexOf('end'));
  });
  it('should error on newline before matching double-quote', function() {
    var testString = '012{"\n';
    try {
      bml.extractJavascript(testString, 3);
      assert(false, 'error expected');
    } catch (e) {
      assert.equal(true, e.message.startsWith('Syntax error'));
    }
  });
  it('should ignore braces in backtick string literals', function() {
    var testString = "012{`\n}`}end";
    assert.equal(bml.extractJavascript(testString, 3), testString.indexOf('end'));
  });
  it('should handle braces in javascript', function() {
    var testString = '012{{{{}}}}end';
    assert.equal(bml.extractJavascript(testString, 3), testString.indexOf('end'));
  });
  it('should be able to read itself (very meta)', function() {
    var testString = '012{' + fs.readFileSync(require.resolve('bml')) + '}!!!!!!';
    assert.equal(bml.extractJavascript(testString, 3), testString.indexOf('!!!!!!'));
  });
});

describe('lineAndColumnOf', function() {
  it('should work at the first character', function() {
    assert.deepEqual(bml.lineAndColumnOf('a', 0), {line: 1, column: 0});
  });
  it('should count newline characters as the ending of a line', function() {
    assert.deepEqual(bml.lineAndColumnOf('a\nb', 1), {line: 1, column: 1});
  });
  it('should work at the start of a new line', function() {
    assert.deepEqual(bml.lineAndColumnOf('a\nb', 2), {line: 2, column: 0});
  });
  it('should work at the end of the string', function() {
    assert.deepEqual(bml.lineAndColumnOf('a\nba', 3), {line: 2, column: 1});
  });
});

describe('parseMode', function() {
  before(function() {
    //bml.setModes({});
  });

  it('should allow empty modes', function() {
    var testString = 'mode test {}end';
    var closeBraceIndex = bml.parseMode(testString, 5);
    assert.equal(closeBraceIndex, testString.indexOf('end'));
    assert(bml.getModes().hasOwnProperty('test'));
    assert(bml.getModes().test instanceof bml.Mode);
    assert(bml.getModes().test.name = 'test');
  });
});
