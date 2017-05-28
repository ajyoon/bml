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

describe('findCodeBlockEnd', function() {
  it('should ignore braces in inline comments', function() {
    var testString = '012{//}\n}end';
    assert.equal(bml.findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should ignore braces in block comments', function() {
    var testString = '012{4/*\n}*/}end';
    assert.equal(bml.findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should ignore braces in single-quote string literals', function() {
    var testString = "012{'}'}end";
    assert.equal(bml.findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should error on newline before matching single-quote', function() {
    var testString = "012{'\n";
    try {
      bml.findCodeBlockEnd(testString, 3);
      assert(false, 'error expected');
    } catch (e) {
      assert(e instanceof bml.JavascriptSyntaxError);
    }
  });
  it('should ignore braces in double-quote string literals', function() {
    var testString = '012{"}"}end';
    assert.equal(bml.findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should error on newline before matching double-quote', function() {
    var testString = '012{"\n';
    try {
      bml.findCodeBlockEnd(testString, 3);
      assert(false, 'error expected');
    } catch (e) {
      assert(e instanceof bml.JavascriptSyntaxError);
    }
  });
  it('should ignore braces in backtick string literals', function() {
    var testString = "012{`\n}`}end";
    assert.equal(bml.findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should handle braces in javascript', function() {
    var testString = '012{{{{}}}}end';
    assert.equal(bml.findCodeBlockEnd(testString, 3), testString.indexOf('end'));
  });
  it('should be able to read itself (very meta)', function() {
    var testString = '012{' + fs.readFileSync(require.resolve('bml')) + '}!!!!!!';
    assert.equal(bml.findCodeBlockEnd(testString, 3), testString.indexOf('!!!!!!'));
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
  beforeEach(function() {
    bml.setModes({});
  });

  it('should allow empty modes', function() {
    var testString = 'mode test {}end';
    var closeBraceIndex = bml.parseMode(testString, 5);
    assert.equal(closeBraceIndex, testString.indexOf('end') - 1);
    assert(bml.getModes().hasOwnProperty('test'));
    assert(bml.getModes().test instanceof bml.Mode);
    assert(bml.getModes().test.name = 'test');
  });

  // it('recognizes rules and passes them off to parseRule', function() {
  //   var ruleEnd = 'MOCK RULE END MARK';
  //   var testString =
  //       `mode test {
  //            // some comments
  //            'bml' as 'BML'${ruleEnd}
  //            // more comments
  //            'javascript' as 'Javascript' 30, 'JS' 10,
  //                'js' 10${ruleEnd}
  //            // more comments
  //       }`;
  //   // Mock parseRule
  //   calls = [];
  //   bml.parseRule = function(string, ruleStartIndex, mode) {
  //     calls.push(ruleStartIndex);
  //     return string.indexOf(ruleEnd, ruleStartIndex) + ruleEnd.length;
  //   };
  //   var closeBraceIndex = bml.parseMode(testString, 5);
  //   assert.deepEqual(calls, [testString.indexOf("'bml'"),
  //                            testString.indexOf("'javascript'")]);
  // });
});

describe('parsePrelude', function() {

  beforeEach(function() {
    bml.setModes({});
  });

  it('knows when there is no prelude', function() {
    var testString = `as long as there is no 'begin' statement
                      parsePrelude will assume there is no prelude at all.
                      begin statements have the form 'begin [using someMode]'
                      when no begin statement is found,
                      index  0 is always returned.`;
    assert.equal(bml.parsePrelude(testString), 0);
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
    assert.equal(bml.parsePrelude(testString), testString.indexOf('begin\n') + 'begin\n'.length);
    assert.equal(global.evalTest, 1);
    assert.equal(global.evalTest2, 2);
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
    assert.equal(bml.parsePrelude(testString), testString.indexOf('begin\n') + 'begin\n'.length);
    assert(bml.getModes().hasOwnProperty('firstMode'));
    assert(bml.getModes().hasOwnProperty('secondMode'));
  });

  it('extracts the beginning mode name and sets the initial mode', function() {
    var testString = `mode test {
                          // do something
                      }
                      begin using test
                     `;
    assert.equal(bml.parsePrelude(testString),
                 testString.indexOf('begin using test\n') + 'begin using test\n'.length);
    assert(bml.getModes().hasOwnProperty('test'));
    assert.equal(bml.getActiveMode().name, 'test');
  });

  it('supports begin statements with "use" instead of "using"', function() {
    var testString = `mode test {
                          // do something
                      }
                      begin use test
                     `;
    assert.equal(bml.parsePrelude(testString),
                 testString.indexOf('begin use test\n') + 'begin use test\n'.length);
    assert(bml.getModes().hasOwnProperty('test'));
    assert.equal(bml.getActiveMode().name, 'test');
  });
});


describe('parseRule', function() {

  var testMode;
  beforeEach(function() {
    testMode = new bml.Mode('test');
  });

  it('can parse a one-to-one rule', function() {
    var testString = "'x' as 'y'\n}";
    assert.equal(bml.parseRule(testString, 0, testMode), testString.length - 1);
    assert.equal(testMode.rules.length, 1);
    assert.deepEqual(testMode.rules[0].matchers, ['x']);
    assert.equal(testMode.rules[0].getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse a one-to-one rule with a weight', function() {
    var testString = "'x' as 'y' 40\n}";
    assert.equal(bml.parseRule(testString, 0, testMode), testString.length - 1);
    assert.equal(testMode.rules.length, 1);
    assert.deepEqual(testMode.rules[0].matchers, ['x']);
    assert.equal(testMode.rules[0].getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse multiple options', function() {
    var testString = "'x' as 'y' 40, 'z' 10\n}";
    assert.equal(bml.parseRule(testString, 0, testMode), testString.length - 1);
    assert.equal(testMode.rules.length, 1);
    assert.deepEqual(testMode.rules[0].matchers, ['x']);
    assert.equal(testMode.rules[0].getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse multiple matchers', function() {
    var testString = "'x', 'z' as 'y' 40\n}";
    assert.equal(bml.parseRule(testString, 0, testMode), testString.length - 1);
    assert.equal(testMode.rules.length, 1);
    assert.deepEqual(testMode.rules[0].matchers, ['x', 'z']);
    assert.equal(testMode.rules[0].getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse multiple matchers and options', function() {
    var testString = "'x', 'z' as 'y' 40, 'a' 10\n}";
    assert.equal(bml.parseRule(testString, 0, testMode), testString.length - 1);
    assert.equal(testMode.rules.length, 1);
    assert.deepEqual(testMode.rules[0].matchers, ['x', 'z']);
    assert.equal(testMode.rules[0].getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse call statements', function() {
    bml.__evalInBMLScope('testFunc = function testFunc() {};');
    testString = "'x' as call testFunc\n}";
    assert.equal(bml.parseRule(testString, 0, testMode), testString.length - 1);
    assert.equal(testMode.rules.length, 1);
    assert.deepEqual(testMode.rules[0].matchers, ['x']);
    assert.equal(testMode.rules[0].getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse call statements after commas', function() {
    bml.__evalInBMLScope('testFunc = function testFunc() {};');
    testString = "'x' as 'y', call testFunc\n}";
    assert.equal(bml.parseRule(testString, 0, testMode), testString.length - 1);
    assert.equal(testMode.rules.length, 1);
    assert.deepEqual(testMode.rules[0].matchers, ['x']);
    assert.equal(testMode.rules[0].getReplacement.replacerType, 'weightedChoice');
    assert.equal(testMode.rules[1].getReplacement.replacerType, 'weightedChoice');
  });

  it('can parse call statements with chances', function() {
    bml.__evalInBMLScope('testFunc = function testFunc() {};');
    testString = "'x' as call testFunc 20\n}";
    assert.equal(bml.parseRule(testString, 0, testMode), testString.length - 1);
    assert.equal(testMode.rules.length, 1);
    assert.deepEqual(testMode.rules[0].matchers, ['x']);
    assert.equal(testMode.rules[0].getReplacement.replacerType, 'weightedChoice');
  });

});
