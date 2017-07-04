var assert = require('assert');
var expect = require('chai').expect;
var fs = require('fs');

var parsers = require('../src/parsers.js');
var errors = require('../src/errors.js');
var EvalBlock = require('../src/evalBlock.js').EvalBlock;
var Mode = require('../src/mode.js').Mode;
var Replacer = require('../src/replacer.js').Replacer;
var Lexer = require('../src/lexer.js').Lexer;
var Token = require('../src/token.js').Token;
var TokenType = require('../src/tokenType.js').TokenType;
var WeightedChoice = require('../src/weightedChoice.js').WeightedChoice;

var JavascriptSyntaxError = errors.JavascriptSyntaxError;
var UnknownTransformError = errors.UnknownTransformError;
var BMLSyntaxError = errors.BMLSyntaxError;

var findCodeBlockEnd = parsers.findCodeBlockEnd;
var parseRule = parsers.parseRule;
var parseMode = parsers.parseMode;
var parsePrelude = parsers.parsePrelude;
var parseUse = parsers.parseUse;
var parseStringLiteral = parsers.parseStringLiteral;
var parseStringLiteralWithLexer = parsers.parseStringLiteralWithLexer;
var parseChoose = parsers.parseChoose;
var createMatcher = parsers.createMatcher;
var parseMatchers = parsers.parseMatchers;
var parseCall = parsers.parseCall;
var parseReplacer = parsers.parseReplacer;


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
    assert.deepEqual(result.mode.rules[0].matchers[0], createMatcher('bml'));
    assert.equal(result.mode.rules[1].matchers.length, 1);
    assert.deepEqual(result.mode.rules[1].matchers[0], createMatcher('javascript'));
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


describe('createMatcher', function() {

  it('Escapes strings for regex when asked to', function() {
    var result = createMatcher('.', false);
    assert.deepEqual(result, /\./y);
  });

  it("Doesn't escape strings when asked not to", function() {
    var result = createMatcher('.', true);
    assert.deepEqual(result, /./y);
  });

});


describe('parseRule', function() {

  it('can parse a one-to-one rule', function() {
    var testString = "'x' as 'y'\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, [createMatcher('x')]);
  });

  it('can parse a one-to-one rule with a weight', function() {
    var testString = "'x' as 'y' 40\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, [createMatcher('x')]);
  });

  it('can parse multiple options', function() {
    var testString = "'x' as 'y' 40, 'z' 10\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, [createMatcher('x')]);
  });

  it('can parse multiple matchers', function() {
    var testString = "'x', 'z' as 'y' 40\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, [createMatcher('x'),
                                            createMatcher('z')]);
  });

  it('can parse multiple matchers and options', function() {
    var testString = "'x', 'z' as 'y' 40, 'a' 10\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, [createMatcher('x'),
                                            createMatcher('z')]);
  });

  it('can parse call statements', function() {
    var testString = "'x' as call testFunc\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, [createMatcher('x')]);
  });

  it('can parse call statements after commas', function() {
    var testString = "'x' as 'y', call testFunc\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, [createMatcher('x')]);
  });

  it('can parse call statements with chances', function() {
    var testString = "'x' as call testFunc 20\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, [createMatcher('x')]);
  });

  it('recognizes regex matchers', function() {
    var testString = "r'.*' as call testFunc 20\n}";
    var result = parseRule(testString, 0);
    assert.equal(result.ruleEndIndex, testString.length - 1);
    assert.deepEqual(result.rule.matchers, [createMatcher('.*', true)]);
  });
});


describe('parseUse', function() {

  it('Extracts the mode name with "use" syntax', function() {
    var testString = "{{use testMode}}";
    var result = parseUse(testString, 0);
    assert.equal(result.blockEndIndex, testString.length);
    assert.equal(result.modeName, 'testMode');
  });

  it('Extracts the mode name with "using" syntax', function() {
    var testString = "{{using testMode}}";
    var result = parseUse(testString, 0);
    assert.equal(result.blockEndIndex, testString.length);
    assert.equal(result.modeName, 'testMode');
  });

  it('Throws an UnknownTransformError when there is a syntax error.', function() {
    var testString = "{{using ????}}";
    try {
      parseUse(testString, 0);
      assert(false, 'error expected');
    } catch (e) {
      assert(e instanceof UnknownTransformError);
    }
  });
});


describe('parseStringLiteral', function() {

  it('can parse normal strings', function() {
    var testString = "'testing testing'";
    var result = parseStringLiteral(testString, 0);
    assert.equal(result.closeQuoteIndex, testString.length - 1);
    assert.equal(result.extractedString, 'testing testing');
  });

  it('can parse strings with escaped quotes', function() {
    var testString = "'testing \\'testing'";
    var result = parseStringLiteral(testString, 0);
    assert.equal(result.closeQuoteIndex, testString.length - 1);
    assert.equal(result.extractedString, 'testing \\\'testing');
  });
});


describe('parseStringLiteralWithLexer', function() {

  it('can parse strings wrapped in single quotes', function() {
    var testString = "'testing testing'";
    var lexer = new Lexer(testString);
    var result = parseStringLiteralWithLexer(lexer);
    assert.equal(result, 'testing testing');
    assert.equal(lexer.index, testString.length);
  });

  it('can parse strings with escaped quotes', function() {
    var testString = "'testing \\'testing'";
    var lexer = new Lexer(testString);
    var result = parseStringLiteralWithLexer(lexer);
    assert.equal(result, 'testing \'testing');
    assert.equal(lexer.index, testString.length);
  });
});


describe('parseChoose', function() {

  it('allows a single unweighted item', function() {
    var testString = "{{'test'}}";
    var result = parseChoose(testString, 0);
    assert.equal(result.blockEndIndex, testString.length - 1);
    assert(result.replacer instanceof Replacer);
  });

  it('allows a single weighted item', function() {
    var testString = "{{'test' 100}}";
    var result = parseChoose(testString, 0);
    assert.equal(result.blockEndIndex, testString.length - 1);
    assert(result.replacer instanceof Replacer);
  });

  it('allows a single unweighted call item', function() {
    var testString = "{{call someFunc}}";
    var result = parseChoose(testString, 0);
    assert.equal(result.blockEndIndex, testString.length - 1);
    assert(result.replacer instanceof Replacer);
  });

  it('allows a single weighted call item', function() {
    var testString = "{{call someFunc 100}}";
    var result = parseChoose(testString, 0);
    assert.equal(result.blockEndIndex, testString.length - 1);
    assert(result.replacer instanceof Replacer);
  });

  it('allows a comma separated mix of literals and calls', function() {
    var testString = "{{'test' 50, call someFunc 40}}";
    var result = parseChoose(testString, 0);
    assert.equal(result.blockEndIndex, testString.length - 1);
    assert(result.replacer instanceof Replacer);
  });

});


describe('parseMatchers', function() {

  it('parsers a single matcher', function() {
    var testString = "'test' as";
    var lexer = new Lexer(testString);
    var result = parseMatchers(lexer);
    assert.deepEqual(result, [/test/y]);
    assert.deepEqual(lexer.peek(), new Token(TokenType.KW_AS,
                                             testString.indexOf('as'),
                                             'as'));
  });

  it('parses a single simple regex matcher', function() {
    var testString = "r'test' as";
    var lexer = new Lexer(testString);
    var result = parseMatchers(lexer);
    assert.deepEqual(result, [/test/y]);
    assert.deepEqual(lexer.peek(), new Token(TokenType.KW_AS,
                                             testString.indexOf('as'),
                                             'as'));
  });

  it('parses a regex matcher with escaped chars', function() {
    var testString = "r'\\stest' as";
    var lexer = new Lexer(testString);
    var result = parseMatchers(lexer);
    assert.deepEqual(result, [/\stest/y]);
    assert.deepEqual(lexer.peek(), new Token(TokenType.KW_AS,
                                             testString.indexOf('as'),
                                             'as'));
  });

  it('parses multiple matchers', function() {
    var testString = "'test', 'test2' as";
    var lexer = new Lexer(testString);
    var result = parseMatchers(lexer);
    assert.deepEqual(result, [/test/y, /test2/y]);
    assert.deepEqual(lexer.peek(), new Token(TokenType.KW_AS,
                                             testString.indexOf('as'),
                                             'as'));
  });

});


describe('parseCall', function() {

  it('errors on malformed call statements', function() {
    var failingStrings = [
      'fails',
      'call 1234876',
      'call',
      'call,',
      'call \''
    ];
    for (var i = 0; i < failingStrings.length; i++) {
      var testString = failingStrings[i];
      var lexer = new Lexer(testString);
      try {
        parseCall(lexer);
        assert(false, `error expected for test string: '${testString}'`);
      } catch (e) {
        expect(e).to.be.an.instanceof(
          BMLSyntaxError,
          `failure for test string: '${testString}'`);
      }
    }
  });

  it('moves the lexer to the character after the call block', function() {
    var testString = 'call test,';
    var lexer = new Lexer(testString);
    var evalBlock = parseCall(lexer);
    expect(evalBlock).to.be.an.instanceof(EvalBlock);
    expect(evalBlock.string).to.equal('test');
    expect(lexer.index).to.equal(testString.length - 1);
  });

});


describe('parseReplacer', function() {

  it('parses a string literal replacer with single quotes', function() {
    var testString = "'test'}";
    var lexer = new Lexer(testString);
    var result = parseReplacer(lexer);
    expect(result.length).to.equal(1);
    expect(result[0]).to.be.an.instanceof(WeightedChoice);
    expect(result[0].choice).to.equal('test');
    expect(result[0].weight).to.equal(null);
    expect(lexer.index).to.equal(testString.length - 1);
  });

  it('parses a string literal replacer with double quotes', function() {
    var testString = '"test"}';
    var lexer = new Lexer(testString);
    var result = parseReplacer(lexer);
    expect(result.length).to.equal(1);
    expect(result[0]).to.be.an.instanceof(WeightedChoice);
    expect(result[0].choice).to.equal('test');
    expect(result[0].weight).to.equal(null);
    expect(lexer.index).to.equal(testString.length - 1);
  });

  it('parses a call replacer', function() {
    var testString = 'call test}';
    var lexer = new Lexer(testString);
    var result = parseReplacer(lexer);
    expect(result.length).to.equal(1);
    expect(result[0]).to.be.an.instanceof(WeightedChoice);
    expect(result[0].choice).to.be.an.instanceof(EvalBlock);
    expect(result[0].choice.string).to.equal('test');
    expect(result[0].weight).to.equal(null);
    expect(lexer.index).to.equal(testString.length - 1);
  });

  it('parses strings with weights', function() {
    var testString = '"test" 5}';
    var lexer = new Lexer(testString);
    var result = parseReplacer(lexer);
    expect(result.length).to.equal(1);
    expect(result[0]).to.be.an.instanceof(WeightedChoice);
    expect(result[0].choice).to.equal('test');
    expect(result[0].weight).to.equal(5);
    expect(lexer.index).to.equal(testString.length - 1);
  });

  it('parses call replacers with weights', function() {
    var testString = 'call test 5}';
    var lexer = new Lexer(testString);
    var result = parseReplacer(lexer);
    expect(result.length).to.equal(1);
    expect(result[0]).to.be.an.instanceof(WeightedChoice);
    expect(result[0].choice).to.be.an.instanceof(EvalBlock);
    expect(result[0].choice.string).to.equal('test');
    expect(result[0].weight).to.equal(5);
    expect(lexer.index).to.equal(testString.length - 1);
  });

  it('parses many replacers with and without weights', function() {
    var testString = 'call test 5, "test2", "test3" 3}';
    var lexer = new Lexer(testString);
    var result = parseReplacer(lexer);
    expect(result.length).to.equal(3);

    expect(result[0]).to.be.an.instanceof(WeightedChoice);
    expect(result[0].choice).to.be.an.instanceof(EvalBlock);
    expect(result[0].choice.string).to.equal('test');
    expect(result[0].weight).to.equal(5);

    expect(result[1]).to.be.an.instanceof(WeightedChoice);
    expect(result[1].choice).to.equal('test2');
    expect(result[1].weight).to.equal(null);

    expect(result[2]).to.be.an.instanceof(WeightedChoice);
    expect(result[2].choice).to.equal('test3');
    expect(result[2].weight).to.equal(3);

    expect(lexer.index).to.equal(testString.length - 1);
  });

  it('treats a new replacement not after a comma as the end of the replacer', function() {
    var testString = '"test" "part of next rule"';
    var lexer = new Lexer(testString);
    var result = parseReplacer(lexer);
    expect(result.length).to.equal(1);
    expect(result[0]).to.be.an.instanceof(WeightedChoice);
    expect(result[0].choice).to.equal('test');
    expect(result[0].weight).to.equal(null);
    expect(lexer.index).to.equal(testString.indexOf('"part'));
  });

});
