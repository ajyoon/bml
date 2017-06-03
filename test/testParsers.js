var assert = require('assert');
var fs = require('fs');

var parsers = require('../src/parsers.js');
var errors = require('../src/errors.js');
var Mode = require('../src/mode.js').Mode;

var JavascriptSyntaxError = errors.JavascriptSyntaxError;

var findCodeBlockEnd = parsers.findCodeBlockEnd;
var parseRule = parsers.parseRule;
var parseMode = parsers.parseMode;
var parsePrelude = parsers.parsePrelude;


describe('findCodeBlockEnd', function() {
  it('should ignore braces in inline comments', function() {
    var testString = '012{//}\n}end';
    assert.equal(findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should ignore braces in block comments', function() {
    var testString = '012{4/*\n}*/}end';
    assert.equal(findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should ignore braces in single-quote string literals', function() {
    var testString = "012{'}'}end";
    assert.equal(findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should error on newline before matching single-quote', function() {
    var testString = "012{'\n";
    try {
      findCodeBlockEnd(testString, 3);
      assert(false, 'error expected');
    } catch (e) {
      assert(e instanceof JavascriptSyntaxError);
    }
  });
  it('should ignore braces in double-quote string literals', function() {
    var testString = '012{"}"}end';
    assert.equal(findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should error on newline before matching double-quote', function() {
    var testString = '012{"\n';
    try {
      findCodeBlockEnd(testString, 3);
      assert(false, 'error expected');
    } catch (e) {
      assert(e instanceof JavascriptSyntaxError);
    }
  });
  it('should ignore braces in backtick string literals', function() {
    var testString = "012{`\n}`}end";
    assert.equal(findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should handle braces in javascript', function() {
    var testString = '012{{{{}}}}end';
    assert.equal(findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should be able to read itself (very meta)', function() {
    var testString = '012{' + fs.readFileSync(require.resolve('../src/parsers.js')) + '}!!!!!!';
    assert.equal(findCodeBlockEnd(testString, 3), testString.indexOf('!!!!!!'));
  });
});


describe('parseMode', function() {

  it('should allow empty modes', function() {
    var testString = 'mode test {}end';
    var result = parseMode(testString, 5);
    assert.equal(result.modeEndIndex, testString.indexOf('end') - 1);
    assert(result.mode instanceof Mode);
    assert.equal(result.mode.name, 'test');
  });

  it('recognizes rules and passes them off to parseRule', function() {
    var testString =
        `mode test {
             // some comments
             'bml' as 'BML'
             // more comments
             'javascript' as 'Javascript' 30, 'JS' 10,
                 'js' 10
             // more comments
        }`;
    var result = parseMode(testString, 5);
    assert.equal(result.modeEndIndex, testString.length - 1);
    assert.equal(result.mode.name, 'test');
    assert.equal(result.mode.rules.length, 2);
    assert.equal(result.mode.rules[0].matchers.length, 1);
    assert.equal(result.mode.rules[0].matchers[0], 'bml');
    assert.equal(result.mode.rules[1].matchers.length, 1);
    assert.equal(result.mode.rules[1].matchers[0], 'javascript');
  });
});

describe('parsePrelude', function() {

  it('knows when there is no prelude', function() {
    var testString = `as long as there is no 'begin' statement
                      parsePrelude will assume there is no prelude at all.
                      begin statements have the form 'begin [using someMode]'
                      when no begin statement is found,
                      index  0 is always returned.`;
    var result = parsePrelude(testString);
    assert.equal(result.preludeEndIndex, 0);
    assert.equal(result.evalBlock, null);
    assert.deepEqual(result.modes, {});
    assert.equal(result.initialMode, null);
  });

  it('finds and executes multiple evaluate blocks', function() {
    var testString = `evaluate {
                          global.evalTest = 1;
                      }
                      // comment
                      evaluate {
                          global.evalTest2 = 2;
                      }
                      begin

                      some text`;
    var result = parsePrelude(testString);
    assert.equal(result.preludeEndIndex, testString.indexOf('begin\n') + 'begin\n'.length);
    assert(result.evalBlock.string.indexOf('global.evalTest = 1;\n') !== -1);
    assert(result.evalBlock.string.indexOf('global.evalTest2 = 2;\n') !== -1);
    assert.deepEqual(result.modes, {});
    assert.equal(result.initialMode, null);
  });

  it('recognizes mode blocks and passes them to parseMode', function() {
    var modeEnd = 'MODE END TEST MARKER';
    var testString = `mode firstMode {
                          // do something
                      }
                      mode secondMode {
                          // do something
                      }
                      begin

                      some text`;
    var result = parsePrelude(testString);
    assert.equal(result.preludeEndIndex, testString.indexOf('begin\n') + 'begin\n'.length);
    assert(result.modes.hasOwnProperty('firstMode'));
    assert(result.modes.hasOwnProperty('secondMode'));
  });

  it('extracts the beginning mode name and sets the initial mode', function() {
    var testString = `mode test {
                          // do something
                      }
                      begin using test
                     `;
    var result = parsePrelude(testString);
    assert.equal(result.preludeEndIndex,
                 testString.indexOf('begin using test\n') + 'begin using test\n'.length);
    assert(result.modes.hasOwnProperty('test'));
    assert.equal(result.initialMode.name, 'test');
  });

  it('supports begin statements with "use" instead of "using"', function() {
    var testString = `mode test {
                          // do something
                      }
                      begin use test
                     `;
    var result = parsePrelude(testString);
    assert.equal(result.preludeEndIndex,
                 testString.indexOf('begin use test\n') + 'begin use test\n'.length);
    assert(result.modes.hasOwnProperty('test'));
    assert.equal(result.initialMode.name, 'test');
  });
});


describe('parseRule', function() {

  it('can parse a one-to-one rule', function() {
    var testString = "'x' as 'y'\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, ['x']);
    assert.equal(result.rule.getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse a one-to-one rule with a weight', function() {
    var testString = "'x' as 'y' 40\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, ['x']);
    assert.equal(result.rule.getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse multiple options', function() {
    var testString = "'x' as 'y' 40, 'z' 10\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, ['x']);
    assert.equal(result.rule.getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse multiple matchers', function() {
    var testString = "'x', 'z' as 'y' 40\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, ['x', 'z']);
    assert.equal(result.rule.getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse multiple matchers and options', function() {
    var testString = "'x', 'z' as 'y' 40, 'a' 10\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, ['x', 'z']);
    assert.equal(result.rule.getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse call statements', function() {
    var testString = "'x' as call testFunc\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, ['x']);
    assert.equal(result.rule.getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse call statements after commas', function() {
    var testString = "'x' as 'y', call testFunc\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, ['x']);
    assert.equal(result.rule.getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse call statements with chances', function() {
    var testString = "'x' as call testFunc 20\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, ['x']);
    assert.equal(result.rule.getReplacement.replacerType, 'weightedChoice');
  });
});
