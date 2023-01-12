import expect from 'expect';
import fs from 'fs';
import path from 'path'

import { Replacer } from '../src/replacer';
import { Lexer } from '../src/lexer';
import { WeightedChoice } from '../src/weightedChoice';
import { BackReference } from '../src/backReference';

import {
  JavascriptSyntaxError,
  BMLSyntaxError,
  BMLDuplicatedRefIndexError,
} from '../src/errors';

import {
  parseEval,
  parseReplacements,
  parseBackReference,
  parseFork,
  parseLiteralBlock,
  parseDocument,
} from '../src/parsers';
import { EvalBlock } from '../src/evalBlock';



describe('parseEval', function() {
  it('can parse an empty block', function() {
    let testString = '[]';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block.contents).toBe('');
    expect(lexer.index).toBe(testString.length);
  });

  it('should ignore brackets in line comments', function() {
    let testString = '[ //]\n]';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block.contents).toBe(' //]\n');
    expect(lexer.index).toBe(testString.length);
  });

  it('should ignore brackets in block comments', function() {
    let testString = '[4/*\n]*/]';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block.contents).toBe('4/*\n]*/');
    expect(lexer.index).toBe(testString.length);
  });

  it('should ignore brackets in single-quote string literals', function() {
    let testString = '[\']\']';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block.contents).toBe('\']\'');
    expect(lexer.index).toBe(testString.length);
  });

  it('should ignore brackets in double-quote string literals', function() {
    let testString = '["]"]';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block.contents).toBe('"]"');
    expect(lexer.index).toBe(testString.length);
  });

  it('should error on newline before matching single-quote', function() {
    let testString = '[\'\n';
    let lexer = new Lexer(testString);
    expect(() => parseEval(lexer)).toThrowError(JavascriptSyntaxError);
  });

  it('should error on newline before matching double-quote', function() {
    let testString = '["\n';
    let lexer = new Lexer(testString);
    expect(() => parseEval(lexer)).toThrowError(JavascriptSyntaxError);
  });

  it('should ignore brackets in backtick string literals', function() {
    let testString = '[`\n]`]';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block.contents).toBe('`\n]`');
    expect(lexer.index).toBe(testString.length);
  });

  it('should handle matching brackets in javascript', function() {
    let testString = '[[[]]]';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block.contents).toBe('[[]]');
    expect(lexer.index).toBe(testString.length);
  });

  it('should be able to read itself (very meta)', function() {
    // Test the parser with a lot of real javascript (typescript, close enough)
    // by reading this file
    const parsersFilePath = require.resolve('../src/parsers.ts');
    let parsersFileContents = ('' + fs.readFileSync(parsersFilePath));
    let testString = '[' + parsersFileContents + ']';
    let lexer = new Lexer(testString);
    let block = parseEval(lexer);
    expect(block.contents).toBe(parsersFileContents);
    expect(lexer.index).toBe(testString.length);
  });
});


describe('parseFork', function() {
  it('allows a single unweighted item', function() {
    let lexer = new Lexer('(test)}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(Replacer);
  });

  it('allows a single weighted item', function() {
    let lexer = new Lexer('(test) 100}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(Replacer);
  });

  it('allows a single unweighted eval block item', function() {
    let lexer = new Lexer('[some js]}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(Replacer);
  });

  it('allows a single weighted eval block item', function() {
    let lexer = new Lexer('[some js] 100}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(Replacer);
  });

  it('allows a comma separated mix of literals and eval blocks', function() {
    let lexer = new Lexer('(test) 50, [some js] 40}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(Replacer);
  });

  it('allows trailing commas', function() {
    let lexer = new Lexer('(foo), (bar),}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(Replacer);
  });

  it('allows the choice to be prefixed by an identifier for reference in later choices', function() {
    let lexer = new Lexer('TestChoice: (test) 50, (test 2) 40}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(Replacer);
    expect((result as Replacer).identifier).toBe('TestChoice');
  });

  it('allows blocks with identifiers to be marked silent with # prefix', function() {
    let lexer = new Lexer('#TestChoice: (test)}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(Replacer);
    expect((result as Replacer).identifier).toBe('TestChoice');
    expect((result as Replacer).isSilent).toBe(true);
  });

  it('allows back references', function() {
    let lexer = new Lexer('@TestChoice: 0 -> (foo)}');
    let result = parseFork(lexer);
    let expectedChoiceMap = new Map();
    expectedChoiceMap.set(0, ['foo']);
    expect(result).toBeInstanceOf(BackReference);
    expect(result).toEqual(new BackReference('TestChoice', expectedChoiceMap, null));
  });

  it('allows grouped back references', function() {
    let lexer = new Lexer('@TestChoice: 0, 1 -> (foo), 2, 3 -> (bar), (baz)}');
    let result = parseFork(lexer);
    let expectedChoiceMap = new Map();
    expectedChoiceMap.set(0, ['foo']);
    expectedChoiceMap.set(1, ['foo']);
    expectedChoiceMap.set(2, ['bar']);
    expectedChoiceMap.set(3, ['bar']);
    expect(result).toBeInstanceOf(BackReference);
    expect(result).toEqual(new BackReference('TestChoice', expectedChoiceMap, ['baz']));
  });
});

describe('parseLiteralBlock', function() {
  it('parses a simple literal block', function() {
    let lexer = new Lexer('[some literal text]]');
    let result = parseLiteralBlock(lexer);
    expect(result).toBe('some literal text');
  })

  it('parses a literal block containing a would-be fork', function() {
    let lexer = new Lexer('[some {(would-be fork)}]]');
    let result = parseLiteralBlock(lexer);
    expect(result).toBe('some {(would-be fork)}');
  })

  it('allows escaping square brackets', function() {
    let lexer = new Lexer('[escaped \\]] brackets]]');
    let result = parseLiteralBlock(lexer);
    expect(result).toBe('escaped ]] brackets');
  })
})


describe('parseReplacements', function() {
  it('parses a string literal replacer with braces', function() {
    let testString = '(test)}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer);
    expect(result.weights.length).toBe(1);
    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].choice).toStrictEqual(['test']);
    expect(result.weights[0].weight).toBe(100);
    expect(lexer.index).toBe(testString.length);
  });

  it('parses an eval block replacer', function() {
    let testString = '[some js]}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer);
    expect(result.weights.length).toBe(1);
    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].weight).toBe(100);
    expect(result.weights[0].choice).toBeInstanceOf(EvalBlock);
    let evalBlock = result.weights[0].choice as EvalBlock;
    expect(evalBlock.contents).toBe('some js');
  });

  it('parses strings with weights', function() {
    let testString = '(test) 5}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer);
    expect(result.weights.length).toBe(1);
    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].choice).toStrictEqual(['test']);
    expect(result.weights[0].weight).toBe(5);
    expect(lexer.index).toBe(testString.length);
  });

  it('parses eval block replacers with weights', function() {
    let testString = '[some js] 5}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer);
    expect(result.weights.length).toBe(1);
    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].weight).toBe(5);
    expect(result.weights[0].choice).toBeInstanceOf(EvalBlock);
    let evalBlock = result.weights[0].choice as EvalBlock;
    expect(evalBlock.contents).toBe('some js');
  });

  it('parses many replacers with and without weights', function() {
    let testString = '[some js] 5, (test2), (test3) 3}';
    let lexer = new Lexer(testString);
    let result = parseReplacements(lexer);
    expect(result.weights.length).toBe(3);

    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].weight).toBe(5);
    expect(result.weights[0].choice).toBeInstanceOf(EvalBlock);
    let evalBlock = result.weights[0].choice as EvalBlock;
    expect(evalBlock.contents).toBe('some js');

    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].weight).toBe(5);
    expect(result.weights[0].choice).toBeInstanceOf(EvalBlock);

    expect(result.weights[1]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[1].choice).toStrictEqual(['test2']);
    expect(result.weights[1].weight).toBe(92);

    expect(result.weights[2]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[2].choice).toStrictEqual(['test3']);
    expect(result.weights[2].weight).toBe(3);

    expect(lexer.index).toBe(testString.length);
  });

  it('fails when two choices are not separated by a comma', function() {
    let testString = '(test) (test 2)';
    let lexer = new Lexer(testString);
    expect(() => {
      parseReplacements(lexer);
    }).toThrowError(BMLSyntaxError);
  });
});

describe('parseBackReference', function() {
  it('errors on non-backref blocks', function() {
    let testString = '(test) 5}';
    let lexer = new Lexer(testString);
    expect(() => parseBackReference(lexer)).toThrow(BMLSyntaxError);
  });

  it('parses a simple case with a single string branch and no fallback', function() {
    let testString = '@TestRef: 0 -> (foo)}';
    let lexer = new Lexer(testString);
    let result = parseBackReference(lexer)!;
    expect(result.referredIdentifier).toBe('TestRef');
    expect(result.choiceMap.size).toBe(1);
    expect(result.choiceMap.get(0)).toStrictEqual(['foo']);
  });

  it('parses a simple case with a single eval block branch and no fallback', function() {
    let testString = '@TestRef: 0 -> [some js]}';
    let result = parseBackReference(new Lexer(testString))!;
    expect(result.referredIdentifier).toBe('TestRef');
    expect(result.choiceMap.size).toBe(1);
    expect(result.choiceMap.get(0)).toBeInstanceOf(EvalBlock);
    expect((result.choiceMap.get(0) as EvalBlock).contents).toBe('some js');
  });

  it('allows a single branch with a fallback', function() {
    let testString = '@TestRef: 0 -> [some js], (fallback)}';
    let result = parseBackReference(new Lexer(testString))!;
    expect(result.referredIdentifier).toBe('TestRef');
    expect(result.choiceMap.size).toBe(1);
    expect(result.choiceMap.get(0)).toBeInstanceOf(EvalBlock);
    expect((result.choiceMap.get(0) as EvalBlock).contents).toBe('some js');
    expect(result.fallback).toStrictEqual(['fallback']);
  });

  it('parses multiple branches of all types with fallback', function() {
    let testString = '@TestRef: 0 -> (foo), 1 -> [some js], 2 -> (bar), [some more js]}';
    let result = parseBackReference(new Lexer(testString))!;
    expect(result.referredIdentifier).toBe('TestRef');
    expect(result.choiceMap.size).toBe(3);
    expect(result.choiceMap.get(0)).toStrictEqual(['foo']);

    expect(result.choiceMap.get(1)).toBeInstanceOf(EvalBlock);
    expect((result.choiceMap.get(1) as EvalBlock).contents).toBe('some js');

    expect(result.choiceMap.get(2)).toStrictEqual(['bar']);

    expect(result.fallback!).toBeInstanceOf(EvalBlock);
    expect((result.fallback! as EvalBlock).contents).toBe('some more js');
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
    testParseStrToGiveSyntaxError('@TestRef: 0 -> (foo), [some js]');
    testParseStrToGiveSyntaxError('@TestRef: 0 -> (foo), [some js], @TestRef2: 0 -> (foo)');
  });

  it('errors on repeated indexes', function() {
    expect(() => {
      parseBackReference(new Lexer('@TestRef: 0 -> (foo), 1 -> (bar), 0 -> (biz)'));
    }).toThrowError(BMLDuplicatedRefIndexError);
  });
});

describe('parseDocument', function() {
  it('can parse the kitchen sink test script', function() {
    const bmlScriptPath = path.resolve(__dirname, 'lao_tzu_36.bml');
    const bmlScript = fs.readFileSync(bmlScriptPath).toString();
    let lexer = new Lexer(bmlScript);
    let ast = parseDocument(lexer, true);
    console.log(ast);
  });
});
