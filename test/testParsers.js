let assert = require('assert');
let expect = require('chai').expect;
let fs = require('fs');

let parsers = require('../src/parsers.js');
let errors = require('../src/errors.js');
let EvalBlock = require('../src/evalBlock.js').EvalBlock;
let Mode = require('../src/mode.js').Mode;
let Replacer = require('../src/replacer.js').Replacer;
let Lexer = require('../src/lexer.js').Lexer;
let Token = require('../src/token.js').Token;
let TokenType = require('../src/tokenType.js').TokenType;
let WeightedChoice = require('../src/weightedChoice.js').WeightedChoice;

let JavascriptSyntaxError = errors.JavascriptSyntaxError;
let UnknownTransformError = errors.UnknownTransformError;
let BMLSyntaxError = errors.BMLSyntaxError;

let parseEval = parsers.parseEval;
let parseRule = parsers.parseRule;
let parseMode = parsers.parseMode;
let parsePrelude = parsers.parsePrelude;
let parseUse = parsers.parseUse;
let parseInlineChoose = parsers.parseInlineChoose;
let createMatcher = parsers.createMatcher;
let parseMatchers = parsers.parseMatchers;
let parseCall = parsers.parseCall;
let parseReplacements = parsers.parseReplacements;
let parseBackReference = parsers.parseBackReference;


describe('parseEval', function() {
  it('can parse an empty block', function() {
    let testString = 'eval {}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).to.equal('');
    expect(lexer.index).to.equal(testString.length);
  });

  it('should ignore braces in inline comments', function() {
    let testString = 'eval {//}\n}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).to.equal('//}\n');
    expect(lexer.index).to.equal(testString.length);
  });

  it('should ignore braces in block comments', function() {
    let testString = 'eval {4/*\n}*/}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).to.equal('4/*\n}*/');
    expect(lexer.index).to.equal(testString.length);
  });

  it('should ignore braces in single-quote string literals', function() {
    let testString = 'eval {\'}\'}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).to.equal('\'}\'');
    expect(lexer.index).to.equal(testString.length);
  });

  it('should ignore braces in double-quote string literals', function() {
    let testString = 'eval {"}"}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).to.equal('"}"');
    expect(lexer.index).to.equal(testString.length);
  });

  it('should error on newline before matching single-quote', function() {
    let testString = 'eval {\'\n';
    let lexer = new Lexer(testString);
    try {
      let block = parseEval(lexer);
      assert(false, 'error expected');
    } catch (e) {
      expect(e).to.be.an.instanceof(JavascriptSyntaxError);
    }
  });

  it('should error on newline before matching double-quote', function() {
    let testString = 'eval {"\n';
    let lexer = new Lexer(testString);
    try {
      let block = parseEval(lexer);
      assert(false, 'error expected');
    } catch (e) {
      expect(e).to.be.an.instanceof(JavascriptSyntaxError);
    }
  });

  it('should ignore braces in backtick string literals', function() {
    let testString = 'eval {`\n}`}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).to.equal('`\n}`');
    expect(lexer.index).to.equal(testString.length);
  });

  it('should handle braces in javascript', function() {
    let testString = 'eval {{{{}}}}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).to.equal('{{{}}}');
    expect(lexer.index).to.equal(testString.length);
  });

  it('should be able to read itself (very meta)', function() {
    let parsersFilePath = require.resolve('../src/parsers.js');
    let parsersFileContents = ('' + fs.readFileSync(parsersFilePath));
    let testString = 'eval {' + parsersFileContents + '}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).to.equal(parsersFileContents);
    expect(lexer.index).to.equal(testString.length);
  });
});

describe('parseMode', function() {
  it('should allow empty modes', function() {
    let testString = 'mode test {}';
    let lexer = new Lexer(testString);
    let mode = parseMode(lexer);
    expect(lexer.index).to.equal(testString.length);
    expect(mode).to.be.an.instanceof(Mode);
    expect(mode.name).to.equal('test');
  });

  it('allows comments within modes', function() {
    let testString =
        `mode test {
             // test
             // test
         }`;
    let lexer = new Lexer(testString);
    let mode = parseMode(lexer);
    expect(lexer.index).to.equal(testString.length);
    expect(mode).to.be.an.instanceof(Mode);
    expect(mode.name).to.equal('test');
  });

  it('recognizes rules and passes them off to parseRule', function() {
    let testString =
        `mode test {
             // some comments
             (bml) as (BML)
             // more comments
             r(javascript) as (Javascript) 30, (JS) 10,
                 (js) 10
             // more comments
        }`;
    let lexer = new Lexer(testString);
    let mode = parseMode(lexer);
    expect(lexer.index).to.equal(testString.length);
    expect(mode).to.be.an.instanceof(Mode);
    expect(mode.name).to.equal('test');
    expect(mode.rules.length).to.equal(2);
  });
});

describe('parsePrelude', function() {
  it('finds and executes multiple eval blocks', function() {
    let testString = `eval {
                          global.evalTest = 1;
                      }
                      // comment
                      eval {
                          global.evalTest2 = 2;
                      }
                      some text`;
    let result = parsePrelude(testString);
    assert.strictEqual(result.preludeEndIndex, testString.indexOf('some text'));
    assert(result.evalBlock.string.indexOf('global.evalTest = 1;\n') !== -1);
    assert(result.evalBlock.string.indexOf('global.evalTest2 = 2;\n') !== -1);
    assert.deepStrictEqual(result.modes, {});
  });

  it('recognizes mode blocks and passes them to parseMode', function() {
    let modeEnd = 'MODE END TEST MARKER';
    let testString = `mode firstMode {
                          // do something
                      }
                      mode secondMode {
                          // do something
                      }
                      some text`;
    let result = parsePrelude(testString);
    assert.strictEqual(result.preludeEndIndex, testString.indexOf('some text'));
    assert(result.modes.hasOwnProperty('firstMode'));
    assert(result.modes.hasOwnProperty('secondMode'));
  });
});


describe('createMatcher', function() {
  it('Escapes strings for regex when asked to', function() {
    let result = createMatcher('.', false);
    assert.deepStrictEqual(result, /\./y);
  });

  it('Doesn\'t escape strings when asked not to', function() {
    let result = createMatcher('.', true);
    assert.deepStrictEqual(result, /./y);
  });
});


describe('parseRule', function() {
  it('can parse a one-to-one rule', function() {
    let testString = '(x) as (y)\n}';
    let lexer = new Lexer(testString);
    let rule = parseRule(lexer);
    expect(lexer.index).to.equal(testString.length - 1);
    expect(rule.matchers.length).to.equal(1);
  });
  
  it('does not allow identifiers in replacers', function() {
    let testString = '(x) as MisplacedTestIdentifier: (y)\n}';
    let lexer = new Lexer(testString);
    try {
      parseRule(lexer);
      assert(false, 'error expected');
    } catch (e) {
      expect(e).to.be.an.instanceof(BMLSyntaxError);
      expect(e.message).to.have.string('Choice identifiers are not allowed in rules');
    }
  });
});


describe('parseUse', function() {
  it('Extracts the mode name with "use" syntax', function() {
    let testString = '{use testMode}';
    let result = parseUse(testString, 0);
    assert.strictEqual(result.blockEndIndex, testString.length);
    assert.strictEqual(result.modeName, 'testMode');
  });

  it('Extracts the mode name with "using" syntax', function() {
    let testString = '{using testMode}';
    let result = parseUse(testString, 0);
    assert.strictEqual(result.blockEndIndex, testString.length);
    assert.strictEqual(result.modeName, 'testMode');
  });

  it('Throws an UnknownTransformError when there is a syntax error.', function() {
    let testString = '{using ????}';
    try {
      parseUse(testString, 0);
      assert(false, 'error expected');
    } catch (e) {
      assert(e instanceof UnknownTransformError);
    }
  });
});


describe('parseInlineChoose', function() {
  it('allows a single unweighted item', function() {
    let testString = '{(test)}';
    let result = parseInlineChoose(testString, 0);
    assert.strictEqual(result.blockEndIndex, testString.length);
    assert(result.replacer instanceof Replacer);
  });

  it('allows a single weighted item', function() {
    let testString = '{(test) 100}';
    let result = parseInlineChoose(testString, 0);
    assert.strictEqual(result.blockEndIndex, testString.length);
    assert(result.replacer instanceof Replacer);
  });

  it('allows a single unweighted call item', function() {
    let testString = '{call someFunc}';
    let result = parseInlineChoose(testString, 0);
    assert.strictEqual(result.blockEndIndex, testString.length);
    assert(result.replacer instanceof Replacer);
  });

  it('allows a single weighted call item', function() {
    let testString = '{call someFunc 100}';
    let result = parseInlineChoose(testString, 0);
    assert.strictEqual(result.blockEndIndex, testString.length);
    assert(result.replacer instanceof Replacer);
  });

  it('allows a comma separated mix of literals and calls', function() {
    let testString = '{(test) 50, call someFunc 40}';
    let result = parseInlineChoose(testString, 0);
    assert.strictEqual(result.blockEndIndex, testString.length);
    assert(result.replacer instanceof Replacer);
  });
  
  it('allows the choice to be prefixed by an identifier for reference in later choices', function() {
    let testString = '{TestChoice: (test) 50, call someFunc 40}';
    let result = parseInlineChoose(testString, 0);
    assert.strictEqual(result.blockEndIndex, testString.length);
    assert(result.replacer instanceof Replacer);
    assert.strictEqual(result.replacer.identifier, 'TestChoice');
  });
});


describe('parseMatchers', function() {
  it('parsers a single matcher', function() {
    let testString = '(test) as';
    let lexer = new Lexer(testString);
    let result = parseMatchers(lexer);
    assert.deepStrictEqual(result, [/test/y]);
    assert.deepStrictEqual(lexer.peek(), new Token(TokenType.KW_AS,
                                                   testString.indexOf('as'),
                                                   'as'));
  });

  it('parses a single simple regex matcher', function() {
    let testString = 'r(test) as';
    let lexer = new Lexer(testString);
    let result = parseMatchers(lexer);
    assert.deepStrictEqual(result, [/test/y]);
    assert.deepStrictEqual(lexer.peek(), new Token(TokenType.KW_AS,
                                                   testString.indexOf('as'),
                                                   'as'));
  });

  it('parses a regex matcher with escaped chars', function() {
    let testString = 'r(\\stest) as';
    let lexer = new Lexer(testString);
    let result = parseMatchers(lexer);
    assert.deepStrictEqual(result, [/\stest/y]);
    assert.deepStrictEqual(lexer.peek(), new Token(TokenType.KW_AS,
                                                   testString.indexOf('as'),
                                                   'as'));
  });

  it('parses multiple matchers', function() {
    let testString = '(test), (test2) as';
    let lexer = new Lexer(testString);
    let result = parseMatchers(lexer);
    assert.deepStrictEqual(result, [/test/y, /test2/y]);
    assert.deepStrictEqual(lexer.peek(), new Token(TokenType.KW_AS,
                                                   testString.indexOf('as'),
                                                   'as'));
  });
});


describe('parseCall', function() {
  it('errors on malformed call statements', function() {
    let failingStrings = [
      'fails',
      'call 1234876',
      'call',
      'call,',
      'call \'',
    ];
    for (let i = 0; i < failingStrings.length; i++) {
      let testString = failingStrings[i];
      let lexer = new Lexer(testString);
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
    let testString = 'call test,';
    let lexer = new Lexer(testString);
    let evalBlock = parseCall(lexer);
    expect(evalBlock).to.be.an.instanceof(EvalBlock);
    expect(evalBlock.string).to.equal('test');
    expect(lexer.index).to.equal(testString.length - 1);
  });
});


describe('parseReplacements', function() {
  it('parses a string literal replacer with braces', function() {
    let testString = '(test)}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer, false);
    expect(result.weights.length).to.equal(1);
    expect(result.weights[0]).to.be.an.instanceof(WeightedChoice);
    expect(result.weights[0].choice).to.equal('test');
    expect(result.weights[0].weight).to.equal(100);
    expect(lexer.index).to.equal(testString.length - 1);
  });

  it('parses a call replacer', function() {
    let testString = 'call test}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer, false);
    expect(result.weights.length).to.equal(1);
    expect(result.weights[0]).to.be.an.instanceof(WeightedChoice);
    expect(result.weights[0].choice).to.be.an.instanceof(EvalBlock);
    expect(result.weights[0].choice.string).to.equal('test');
    expect(result.weights[0].weight).to.equal(100);
    expect(lexer.index).to.equal(testString.length - 1);
  });

  it('parses strings with weights', function() {
    let testString = '(test) 5}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer, false);
    expect(result.weights.length).to.equal(1);
    expect(result.weights[0]).to.be.an.instanceof(WeightedChoice);
    expect(result.weights[0].choice).to.equal('test');
    expect(result.weights[0].weight).to.equal(5);
    expect(lexer.index).to.equal(testString.length - 1);
  });

  it('parses call replacers with weights', function() {
    let testString = 'call test 5}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer, false);
    expect(result.weights.length).to.equal(1);
    expect(result.weights[0]).to.be.an.instanceof(WeightedChoice);
    expect(result.weights[0].choice).to.be.an.instanceof(EvalBlock);
    expect(result.weights[0].choice.string).to.equal('test');
    expect(result.weights[0].weight).to.equal(5);
    expect(lexer.index).to.equal(testString.length - 1);
  });

  it('parses many replacers with and without weights', function() {
    let testString = 'call test 5, (test2), (test3) 3}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer, false);
    expect(result.weights.length).to.equal(3);

    expect(result.weights[0]).to.be.an.instanceof(WeightedChoice);
    expect(result.weights[0].choice).to.be.an.instanceof(EvalBlock);
    expect(result.weights[0].choice.string).to.equal('test');
    expect(result.weights[0].weight).to.equal(5);

    expect(result.weights[1]).to.be.an.instanceof(WeightedChoice);
    expect(result.weights[1].choice).to.equal('test2');
    expect(result.weights[1].weight).to.equal(92);

    expect(result.weights[2]).to.be.an.instanceof(WeightedChoice);
    expect(result.weights[2].choice).to.equal('test3');
    expect(result.weights[2].weight).to.equal(3);

    expect(lexer.index).to.equal(testString.length - 1);
  });
  
  it('treats a new replacement not after a comma as the end of the replacer', function() {
    let testString = '(test) (part of next rule)';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer, false);
    expect(result.weights.length).to.equal(1);
    expect(result.weights[0]).to.be.an.instanceof(WeightedChoice);
    expect(result.weights[0].choice).to.equal('test');
    expect(result.weights[0].weight).to.equal(100);
    expect(lexer.index).to.equal(testString.indexOf('(part'));
  });
});

describe('parseBackReference', function() {
  it('returns null on non-backref blocks', function() {
    let testString = '(test) 5}';
    let lexer = new Lexer(testString);
    let result = parseBackReference(lexer);
    expect(result).to.equal(null);
  });

  it('parses a simple case with a single string branch and no fallback', function() {
    let testString = '@TestRef: 0 -> (foo)}';
    let lexer = new Lexer(testString);
    let result = parseBackReference(lexer);
    expect(result.referredIdentifier).to.equal('TestRef');
    expect(Object.keys(result.choiceMap)).to.have.lengthOf(1);
    expect(result.choiceMap[0]).to.equal('foo');
  });
  
  it('parses a simple case with a single call branch and no fallback', function() {
    let testString = '@TestRef: 0 -> call foo}';
    let lexer = new Lexer(testString);
    let result = parseBackReference(lexer);
    expect(result.referredIdentifier).to.equal('TestRef');
    expect(Object.keys(result.choiceMap)).to.have.lengthOf(1);
    expect(result.choiceMap[0]).to.be.an.instanceof(EvalBlock);
    expect(result.choiceMap[0].string).to.equal('foo');
  });
  
  it('parses multiple branches of all types', function() {
    let testString = '@TestRef: 0 -> (foo), 1 -> call someFunc, 2 -> (bar)}';
    let lexer = new Lexer(testString);
    let result = parseBackReference(lexer);
    expect(result.referredIdentifier).to.equal('TestRef');
    expect(Object.keys(result.choiceMap)).to.have.lengthOf(3);
    expect(result.choiceMap[0]).to.equal('foo');
    expect(result.choiceMap[1]).to.be.an.instanceof(EvalBlock);
    expect(result.choiceMap[1].string).to.equal('someFunc');
    expect(result.choiceMap[2]).to.equal('bar');
  });
  
  it('throws an error when unexpected tokens are given', function() {
    let testString = '@TestRef: 0 -> (foo), 1 -> call someFunc, 2 -> (bar)}';
    let lexer = new Lexer(testString);
    try {
      parseBackReference(new Lexer('@TestRef: aaskfj'));
      assert(false, 'error expected');
    } catch (e) {
      assert(e instanceof BMLSyntaxError);
    }
  });
  
  // TODO test more error cases like broken arrows, other nonsense input
  
  xit('disallows repeated indexes', function() {
    // maybe this shouldn't be performed in the parser,
    // but writing it down here so i don't forget
  });
});
