import expect from 'expect';
import fs from 'fs';

import { FunctionCall } from '../src/functionCall';
import { Mode } from '../src/mode';
import { Rule } from '../src/rule';
import { Replacer } from '../src/replacer';
import { Lexer } from '../src/lexer';
import { Token } from '../src/token';
import { TokenType } from '../src/tokenType';
import { WeightedChoice } from '../src/weightedChoice';
import { BackReference } from '../src/backReference';
import noOp from '../src/noOp';

import {
  JavascriptSyntaxError,
  UnknownTransformError,
  BMLSyntaxError,
  BMLDuplicatedRefIndexError,
  ModeNameError,
} from '../src/errors';

import {
  parseEval, parseRule, parseMode, parsePrelude, parseUse,
  parseInlineCommand, parseMatchers, parseCall, parseReplacements,
  parseBackReference,
} from '../src/parsers';



describe('parseEval', function() {
  it('can parse an empty block', function() {
    let testString = 'eval {}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).toBe('');
    expect(lexer.index).toBe(testString.length);
  });

  it('should ignore braces in inline comments', function() {
    let testString = 'eval { //}\n}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).toBe(' //}\n');
    expect(lexer.index).toBe(testString.length);
  });

  it('should ignore braces in block comments', function() {
    let testString = 'eval {4/*\n}*/}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).toBe('4/*\n}*/');
    expect(lexer.index).toBe(testString.length);
  });

  it('should ignore braces in single-quote string literals', function() {
    let testString = 'eval {\'}\'}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).toBe('\'}\'');
    expect(lexer.index).toBe(testString.length);
  });

  it('should ignore braces in double-quote string literals', function() {
    let testString = 'eval {"}"}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).toBe('"}"');
    expect(lexer.index).toBe(testString.length);
  });

  it('should error on newline before matching single-quote', function() {
    let testString = 'eval {\'\n';
    let lexer = new Lexer(testString);
    expect(() => parseEval(lexer)).toThrowError(JavascriptSyntaxError);
  });

  it('should error on newline before matching double-quote', function() {
    let testString = 'eval {"\n';
    let lexer = new Lexer(testString);
    expect(() => parseEval(lexer)).toThrowError(JavascriptSyntaxError);
  });

  it('should ignore braces in backtick string literals', function() {
    let testString = 'eval {`\n}`}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).toBe('`\n}`');
    expect(lexer.index).toBe(testString.length);
  });

  it('should handle braces in javascript', function() {
    let testString = 'eval {{{{}}}}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).toBe('{{{}}}');
    expect(lexer.index).toBe(testString.length);
  });

  it('should be able to read itself (very meta)', function() {
    const parsersFilePath = require.resolve('../src/parsers.ts');
    let parsersFileContents = ('' + fs.readFileSync(parsersFilePath));
    let testString = 'eval {' + parsersFileContents + '}';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block).toBe(parsersFileContents);
    expect(lexer.index).toBe(testString.length);
  });
});

describe('parseMode', function() {
  it('should allow empty modes', function() {
    let testString = 'mode test {}';
    let lexer = new Lexer(testString);
    let mode = parseMode(lexer);
    expect(lexer.index).toBe(testString.length);
    expect(mode).toBeInstanceOf(Mode);
    expect(mode.name).toBe('test');
  });

  it('allows comments within modes', function() {
    let testString =
      `mode test {
             // test
             // test
         }`;
    let lexer = new Lexer(testString);
    let mode = parseMode(lexer);
    expect(lexer.index).toBe(testString.length);
    expect(mode).toBeInstanceOf(Mode);
    expect(mode.name).toBe('test');
  });

  it('fails when mode name is absent', function() {
    let lexer = new Lexer('mode {}');
    expect(() => parseMode(lexer)).toThrowError(BMLSyntaxError);
  });

  it('fails when mode name is malformed', function() {
    let lexer = new Lexer('mode ??? {}');
    expect(() => parseMode(lexer)).toThrowError(BMLSyntaxError);
  });

  it('fails when special mode name "none" is used', function() {
    let lexer = new Lexer('mode none {}');
    expect(() => parseMode(lexer)).toThrowError(ModeNameError);
  });

  it('can parse a mixture of literal and regex matcher rules', function() {
    let testString =
      `mode test {
             // some comments
             (bml) -> {(BML), match}
             // more comments
             /javascript/ -> {(Javascript) 30, (JS) 10,
                 (js) 10, match}
             // more comments
        }`;
    let lexer = new Lexer(testString);
    let mode = parseMode(lexer);
    expect(lexer.index).toBe(testString.length);
    expect(mode).toBeInstanceOf(Mode);
    expect(mode.name).toBe('test');
    expect(mode.rules).toHaveLength(2);
    expect(mode.rules[0]).toEqual(new Rule([/bml/y], new Replacer(
      [new WeightedChoice('BML', null),
      new WeightedChoice(noOp, null)
      ], null, false)));
    expect(mode.rules[1]).toEqual(new Rule([/javascript/y], new Replacer(
      [new WeightedChoice('Javascript', 30),
      new WeightedChoice('JS', 10),
      new WeightedChoice('js', 10),
      new WeightedChoice(noOp, null)
      ],
      null, false)));
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

    expect(result.preludeEndIndex).toBe(testString.indexOf('some text'));
    expect(result.evalBlock.contents).toContain('global.evalTest = 1;\n');
    expect(result.evalBlock.contents).toContain('global.evalTest2 = 2;\n');
    expect(result.modes).toEqual({});
  });

  it('recognizes mode blocks and passes them to parseMode', function() {
    let testString = `mode firstMode {
                          // do something
                      }
                      mode secondMode {
                          // do something
                      }
                      some text`;
    let result = parsePrelude(testString);

    expect(result.preludeEndIndex).toBe(testString.indexOf('some text'));
    expect(result.modes).toHaveProperty('firstMode');
    expect(result.modes).toHaveProperty('secondMode');
  });
});


describe('parseRule', function() {
  it('can parse a one-to-one rule', function() {
    let testString = '(x) -> {(y)}';
    let lexer = new Lexer(testString);
    let rule = parseRule(lexer);
    expect(lexer.index).toBe(testString.length);
    expect(rule.matchers.length).toBe(1);
  });

  it('does not allow identifiers in replacers', function() {
    let testString = '(x) -> {MisplacedTestIdentifier: (y)}';
    let lexer = new Lexer(testString);
    expect(() => parseRule(lexer)).toThrowError(BMLSyntaxError);
  });

  it('maps `match` keyword replacers to no-ops', function() {
    let testString = '(a) -> {(b), match 40}';
    let lexer = new Lexer(testString);
    let rule = parseRule(lexer);
    expect(lexer.index).toBe(testString.length);
    expect(rule).toEqual(new Rule([/a/y], new Replacer(
      [new WeightedChoice('b', null),
      new WeightedChoice(noOp, 40)],
      null, false)));
  });

  it('Errors if multiple `match` replacers are used', function() {
    let testString = '(x) -> {match, match 50}';
    let lexer = new Lexer(testString);
    expect(() => parseRule(lexer)).toThrowError(BMLSyntaxError);
  });
});


describe('parseUse', function() {
  it('Extracts the mode name', function() {
    let testString = '{use testMode}';
    let result = parseUse(testString, 0);
    expect(result.blockEndIndex).toBe(testString.length);
    expect(result.modeName).toBe('testMode');
  });

  it('Errors when using old "using" syntax', function() {
    expect(() => parseUse('{using testMode}', 0)).toThrowError(UnknownTransformError);
  });

  it('Throws an UnknownTransformError when there is a syntax error.', function() {
    let testString = '{use ????}';
    expect(() => parseUse(testString, 0)).toThrowError(UnknownTransformError);
  });
});


describe('parseInlineCommand', function() {
  it('allows a single unweighted item', function() {
    let testString = '{(test)}';
    let result = parseInlineCommand(testString, 0);
    expect(result.blockEndIndex).toBe(testString.length);
    expect(result.backReference).toBeNull();
    expect(result.replacer).toBeInstanceOf(Replacer);
  });

  it('allows a single weighted item', function() {
    let testString = '{(test) 100}';
    let result = parseInlineCommand(testString, 0);
    expect(result.blockEndIndex).toBe(testString.length);
    expect(result.backReference).toBeNull();
    expect(result.replacer).toBeInstanceOf(Replacer);
  });

  it('allows a single unweighted call item', function() {
    let testString = '{call someFunc}';
    let result = parseInlineCommand(testString, 0);
    expect(result.blockEndIndex).toBe(testString.length);
    expect(result.backReference).toBeNull();
    expect(result.replacer).toBeInstanceOf(Replacer);
  });

  it('allows a single weighted call item', function() {
    let testString = '{call someFunc 100}';
    let result = parseInlineCommand(testString, 0);
    expect(result.blockEndIndex).toBe(testString.length);
    expect(result.backReference).toBeNull();
    expect(result.replacer).toBeInstanceOf(Replacer);
  });

  it('allows a comma separated mix of literals and calls', function() {
    let testString = '{(test) 50, call someFunc 40}';
    let result = parseInlineCommand(testString, 0);
    expect(result.blockEndIndex).toBe(testString.length);
    expect(result.backReference).toBeNull();
    expect(result.replacer).toBeInstanceOf(Replacer);
  });

  it('allows trailing commas', function() {
    let testString = '{(foo), (bar),}';
    let result = parseInlineCommand(testString, 0);
    expect(result.blockEndIndex).toBe(testString.length);
    expect(result.backReference).toBeNull();
    expect(result.replacer).toBeInstanceOf(Replacer);
  });

  it('allows the choice to be prefixed by an identifier for reference in later choices', function() {
    let testString = '{TestChoice: (test) 50, call someFunc 40}';
    let result = parseInlineCommand(testString, 0);
    expect(result.replacer).toBeInstanceOf(Replacer);
    expect(result.blockEndIndex).toBe(testString.length);
    expect(result.backReference).toBeNull();
    expect(result.replacer!.identifier).toBe('TestChoice');
  });

  it('allows blocks with identifiers to be marked silent with # prefix', function() {
    let testString = '{#TestChoice: (test)}';
    let result = parseInlineCommand(testString, 0);
    expect(result.replacer).toBeInstanceOf(Replacer);
    expect(result.blockEndIndex).toBe(testString.length);
    expect(result.backReference).toBeNull();
    expect(result.replacer!.identifier).toBe('TestChoice');
    expect(result.replacer!.isSilent).toBe(true);
  });

  it('allows back references', function() {
    let testString = '{@TestChoice: 0 -> (foo)}';
    let result = parseInlineCommand(testString, 0);
    expect(result.blockEndIndex).toBe(testString.length);
    let expectedChoiceMap = new Map();
    expectedChoiceMap.set(0, 'foo');
    expect(result.backReference).toEqual(new BackReference('TestChoice', expectedChoiceMap, null));
    expect(result.replacer).toBeNull();
  });

  it('allows grouped back references', function() {
    let testString = '{@TestChoice: 0, 1 -> (foo), 2, 3 -> (bar), (baz)}';
    let result = parseInlineCommand(testString, 0);
    expect(result.blockEndIndex).toBe(testString.length);
    let expectedChoiceMap = new Map();
    expectedChoiceMap.set(0, 'foo');
    expectedChoiceMap.set(1, 'foo');
    expectedChoiceMap.set(2, 'bar');
    expectedChoiceMap.set(3, 'bar');
    expect(result.backReference).toEqual(new BackReference('TestChoice', expectedChoiceMap, 'baz'));
    expect(result.replacer).toBeNull();
  });
});


describe('parseMatchers', function() {
  it('parsers a single matcher', function() {
    let testString = '(test) ->';
    let lexer = new Lexer(testString);
    let result = parseMatchers(lexer);
    expect(result).toEqual([/test/y]);
    let idx = testString.indexOf('->');
    expect(lexer.peek()).toEqual(new Token(TokenType.ARROW, idx, idx + 2, '->'));
  });

  it('parses a single simple regex matcher', function() {
    let testString = '/test/ ->';
    let lexer = new Lexer(testString);
    let result = parseMatchers(lexer);
    expect(result).toEqual([/test/y]);
    let idx = testString.indexOf('->');
    expect(lexer.peek()).toEqual(new Token(TokenType.ARROW, idx, idx + 2, '->'));
  });

  it('parses a regex matcher with escaped chars', function() {
    // Escaping in JS string literals gets confusing, but I've
    // verified this is how `/\s escaped \/ slash!/ ->` read from
    // file is written in a string.
    let testString = '/space \\s and escaped \\/ slash!/ ->';
    let lexer = new Lexer(testString);
    let result = parseMatchers(lexer);
    expect(result).toEqual([/space \s and escaped \/ slash!/y]);
    expect(lexer.peek()).toEqual(new Token(TokenType.ARROW, 33, 35, '->'));
  });

  it('parses regex matchers ending with asterisks', function() {
    let testString = '/test*/ ->';
    let lexer = new Lexer(testString);
    let result = parseMatchers(lexer);
    expect(result).toEqual([/test*/y]);
    expect(lexer.peek()).toEqual(new Token(TokenType.ARROW, 8, 10, '->'));
  });

  it('parses multiple matchers', function() {
    let testString = '(test), /test2/ ->';
    let lexer = new Lexer(testString);
    let result = parseMatchers(lexer);
    expect(result).toEqual([/test/y, /test2/y]);
    let idx = testString.indexOf('->');
    expect(lexer.peek()).toEqual(new Token(TokenType.ARROW, idx, idx + 2, '->'));
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
      expect(() => parseCall(lexer)).toThrowError(BMLSyntaxError);
    }
  });

  it('moves the lexer to the character after the call block', function() {
    let testString = 'call test,';
    let lexer = new Lexer(testString);
    let functionCall = parseCall(lexer);
    expect(functionCall).toBeInstanceOf(FunctionCall);
    expect(functionCall.functionName).toBe('test');
    expect(lexer.index).toBe(testString.length - 1);
  });
});


describe('parseReplacements', function() {
  it('parses a string literal replacer with braces', function() {
    let testString = '(test)}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer, false);
    expect(result.weights.length).toBe(1);
    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].choice).toBe('test');
    expect(result.weights[0].weight).toBe(100);
    expect(lexer.index).toBe(testString.length);
  });

  it('parses a call replacer', function() {
    let testString = 'call test}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer, false);
    expect(result.weights.length).toBe(1);
    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].choice).toBeInstanceOf(FunctionCall);
    expect((result.weights[0].choice as FunctionCall).functionName).toBe('test');
    expect(result.weights[0].weight).toBe(100);
    expect(lexer.index).toBe(testString.length);
  });

  it('parses strings with weights', function() {
    let testString = '(test) 5}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer, false);
    expect(result.weights.length).toBe(1);
    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].choice).toBe('test');
    expect(result.weights[0].weight).toBe(5);
    expect(lexer.index).toBe(testString.length);
  });

  it('parses call replacers with weights', function() {
    let testString = 'call test 5}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer, false);
    expect(result.weights.length).toBe(1);
    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].choice).toBeInstanceOf(FunctionCall);
    expect((result.weights[0].choice as FunctionCall).functionName).toBe('test');
    expect(result.weights[0].weight).toBe(5);
    expect(lexer.index).toBe(testString.length);
  });

  it('parses many replacers with and without weights', function() {
    let testString = 'call test 5, (test2), (test3) 3}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer, false);
    expect(result.weights.length).toBe(3);

    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].choice).toBeInstanceOf(FunctionCall);
    expect((result.weights[0].choice as FunctionCall).functionName).toBe('test');
    expect(result.weights[0].weight).toBe(5);

    expect(result.weights[1]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[1].choice).toBe('test2');
    expect(result.weights[1].weight).toBe(92);

    expect(result.weights[2]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[2].choice).toBe('test3');
    expect(result.weights[2].weight).toBe(3);

    expect(lexer.index).toBe(testString.length);
  });

  it('fails when two choices are not separated by a comma', function() {
    let testString = '(test) (part of next rule)';
    let lexer = new Lexer(testString);
    expect(() => {
      parseReplacements(lexer, false);
    }).toThrowError(BMLSyntaxError);
  });
});

describe('parseBackReference', function() {
  it('returns null on non-backref blocks', function() {
    let testString = '(test) 5}';
    let lexer = new Lexer(testString);
    let result = parseBackReference(lexer)!;
    expect(result).toBeNull();
  });

  it('parses a simple case with a single string branch and no fallback', function() {
    let testString = '@TestRef: 0 -> (foo)}';
    let lexer = new Lexer(testString);
    let result = parseBackReference(lexer)!;
    expect(result.referredIdentifier).toBe('TestRef');
    expect(result.choiceMap.size).toBe(1);
    expect(result.choiceMap.get(0)).toBe('foo');
  });

  it('parses a simple case with a single call branch and no fallback', function() {
    let testString = '@TestRef: 0 -> call foo}';
    let result = parseBackReference(new Lexer(testString))!;
    expect(result.referredIdentifier).toBe('TestRef');
    expect(result.choiceMap.size).toBe(1);
    expect(result.choiceMap.get(0)).toBeInstanceOf(FunctionCall);
    expect((result.choiceMap.get(0) as FunctionCall).functionName).toBe('foo');
  });

  it('allows a single branch with a fallback', function() {
    let testString = '@TestRef: 0 -> call foo, (fallback)}';
    let result = parseBackReference(new Lexer(testString))!;
    expect(result.referredIdentifier).toBe('TestRef');
    expect(result.choiceMap.size).toBe(1);
    expect(result.choiceMap.get(0)).toBeInstanceOf(FunctionCall);
    expect((result.choiceMap.get(0) as FunctionCall).functionName).toBe('foo');
    expect(result.fallback).toBe('fallback');
  });

  it('parses multiple branches of all types with fallback', function() {
    let testString = '@TestRef: 0 -> (foo), 1 -> call someFunc, 2 -> (bar), call fallbackFunc}';
    let result = parseBackReference(new Lexer(testString))!;
    expect(result.referredIdentifier).toBe('TestRef');
    expect(result.choiceMap.size).toBe(3);
    expect(result.choiceMap.get(0)).toBe('foo');
    expect(result.choiceMap.get(1)).toBeInstanceOf(FunctionCall);
    expect((result.choiceMap.get(1) as FunctionCall).functionName).toBe('someFunc');
    expect(result.choiceMap.get(2)).toBe('bar');
    expect(result.fallback!).toBeInstanceOf(FunctionCall);
    expect((result.fallback! as FunctionCall).functionName).toBe('fallbackFunc');
  });

  it('parses copy refs', function() {
    let testString = '@TestRef}';
    let lexer = new Lexer(testString);
    let result = parseBackReference(lexer)!;
    expect(result.referredIdentifier).toBe('TestRef');
    expect(result.choiceMap.size).toBe(0);
  });

  function testParseStrToGiveSyntaxError(backRefString: string) {
    expect(() => {
      parseBackReference(new Lexer(backRefString));
    }).toThrowError(BMLSyntaxError);
  }

  it('throws an error when invalid syntax is used', function() {
    testParseStrToGiveSyntaxError('@TestRef: aaskfj');
    testParseStrToGiveSyntaxError('@TestRef: 0 - > (foo)');
    testParseStrToGiveSyntaxError('@TestRef: 0 -> {foo}');
    testParseStrToGiveSyntaxError('@TestRef: (foo) -> {foo}');
    testParseStrToGiveSyntaxError('@TestRef: (foo)');
    testParseStrToGiveSyntaxError('@TestRef: (foo) 10');
    testParseStrToGiveSyntaxError('@TestRef: 0 -> (foo),, 1 -> (bar)');
    testParseStrToGiveSyntaxError('@TestRef: 0,,2 -> (foo), 1 -> (bar)');
    testParseStrToGiveSyntaxError('@TestRef: 0, 1');
    testParseStrToGiveSyntaxError('@TestRef: 0 -> (foo), (bar)');
    testParseStrToGiveSyntaxError('@TestRef: 0 -> (foo), call bar');
    testParseStrToGiveSyntaxError('@TestRef: 0 -> (foo), call bar, @TestRef2: 0 -> (foo)');
  });

  it('errors on repeated indexes', function() {
    expect(() => {
      parseBackReference(new Lexer('@TestRef: 0 -> (foo), 1 -> (bar), 0 -> (biz)'));
    }).toThrowError(BMLDuplicatedRefIndexError);
  });
});
