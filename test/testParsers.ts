import expect from 'expect';
import fs from 'fs';
import path from 'path'

import { ChoiceFork } from '../src/choiceFork';
import { Lexer } from '../src/lexer';
import { WeightedChoice } from '../src/weightedChoice';
import { Reference } from '../src/reference';
import { AstNode } from '../src/ast';

import {
  JavascriptSyntaxError,
  BMLSyntaxError,
  BMLDuplicatedRefIndexError,
} from '../src/errors';

import {
  parseEval,
  parseFork,
  parseLiteralBlock,
  parseDocument,
} from '../src/parsers';
import { EvalBlock } from '../src/evalBlock';


function assertParseForkGivesSyntaxError(forkSrc: string) {
  expect(() => {
    parseFork(new Lexer(forkSrc));
  }).toThrowError(BMLSyntaxError);
}


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
    expect(result).toBeInstanceOf(ChoiceFork);
  });

  it('allows a single weighted item', function() {
    let lexer = new Lexer('(test) 100}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(ChoiceFork);
  });

  it('allows a single unweighted eval block item', function() {
    let lexer = new Lexer('[some js]}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(ChoiceFork);
  });

  it('allows a single weighted eval block item', function() {
    let lexer = new Lexer('[some js] 100}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(ChoiceFork);
  });

  it('allows a comma separated mix of literals and eval blocks', function() {
    let lexer = new Lexer('(test) 50, [some js] 40}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(ChoiceFork);
  });

  it('allows trailing commas', function() {
    let lexer = new Lexer('(foo), (bar),}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(ChoiceFork);
  });

  it('allows the choice to be prefixed by an identifier for reference in later choices', function() {
    let lexer = new Lexer('TestChoice: (test) 50, (test 2) 40}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(ChoiceFork);
    expect((result as ChoiceFork).identifier).toBe('TestChoice');
  });

  it('allows identifiers using non-ascii characters', function() {
    // Some characters from Tao Te Ching 15, where I ran into this bug
    let lexer = new Lexer('微: (foo)}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(ChoiceFork);
    expect((result as ChoiceFork).identifier).toBe('微');
    lexer = new Lexer('微妙玄通: (foo)}');
    result = parseFork(lexer);
    expect(result).toBeInstanceOf(ChoiceFork);
    expect((result as ChoiceFork).identifier).toBe('微妙玄通');
  });

  it('errors on a bare id with no branches', function() {
    assertParseForkGivesSyntaxError('TestChoice:}');
    assertParseForkGivesSyntaxError('TestChoice}');
  });

  it('allows blocks with identifiers to be marked silent with # prefix', function() {
    let lexer = new Lexer('#TestChoice: (test)}');
    let result = parseFork(lexer);
    expect(result).toBeInstanceOf(ChoiceFork);
    expect((result as ChoiceFork).identifier).toBe('TestChoice');
    expect((result as ChoiceFork).isSilent).toBe(true);
  });

  it('allows references', function() {
    let lexer = new Lexer('@TestChoice: 0 -> (foo)}');
    let result = parseFork(lexer);
    let expectedChoiceMap = new Map();
    expectedChoiceMap.set(0, ['foo']);
    expect(result).toBeInstanceOf(Reference);
    expect(result).toEqual(new Reference('TestChoice', expectedChoiceMap, [], false));
  });

  it('allows grouped mappings in references', function() {
    let lexer = new Lexer('@TestChoice: 0, 1 -> (foo), 2, 3 -> (bar), (baz)}');
    let result = parseFork(lexer);
    let expectedChoiceMap = new Map();
    expectedChoiceMap.set(0, ['foo']);
    expectedChoiceMap.set(1, ['foo']);
    expectedChoiceMap.set(2, ['bar']);
    expectedChoiceMap.set(3, ['bar']);
    expect(result).toBeInstanceOf(Reference);
    expect(result).toEqual(new Reference(
      'TestChoice', expectedChoiceMap, [new WeightedChoice(['baz'], 100)], false));
  });

  it('allows multiple fallback branches in references', function() {
    let lexer = new Lexer('@TestChoice: 0 -> (foo), (bar) 60, (baz)}');
    let result = parseFork(lexer);
    let expectedChoiceMap = new Map();
    expectedChoiceMap.set(0, ['foo']);
    expect(result).toBeInstanceOf(Reference);
    let expectedWeights = [
      new WeightedChoice(['bar'], 60),
      new WeightedChoice(['baz'], 40),
    ];
    expect(result).toEqual(new Reference(
      'TestChoice', expectedChoiceMap, expectedWeights, false));
  })

  it('allows forks to be used directly as branches', function() {
    let lexer = new Lexer('{(foo)} 60, (bar)}');
    let result = parseFork(lexer) as ChoiceFork;
    let expectedResult = new ChoiceFork([
      new WeightedChoice([
        // Nested fork
        new ChoiceFork([
          new WeightedChoice(['foo'], 100)
        ], null, false)
      ], 60),
      // Alternate branch in outer fork
      new WeightedChoice(['bar'], 40)
    ], null, false);
    expect(result).toEqual(expectedResult);
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


describe('parseFork', function() {
  it('parses a choice fork with a single text branch', function() {
    let testString = '(test)}';
    let lexer = new Lexer(testString);
    let result = parseFork(lexer) as ChoiceFork;
    expect(result.weights.length).toBe(1);
    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].choice).toStrictEqual(['test']);
    expect(result.weights[0].weight).toBe(100);
    expect(lexer.index).toBe(testString.length);
  });

  it('parses an eval block branch', function() {
    let testString = '[some js]}';
    let lexer = new Lexer(testString);
    let result = parseFork(lexer) as ChoiceFork;
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
    let result = parseFork(lexer) as ChoiceFork;
    expect(result.weights.length).toBe(1);
    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].choice).toStrictEqual(['test']);
    expect(result.weights[0].weight).toBe(5);
    expect(lexer.index).toBe(testString.length);
  });

  it('parses eval block branch with weight', function() {
    let testString = '[some js] 5}';
    let lexer = new Lexer(testString);
    let result = parseFork(lexer) as ChoiceFork;
    expect(result.weights.length).toBe(1);
    expect(result.weights[0]).toBeInstanceOf(WeightedChoice);
    expect(result.weights[0].weight).toBe(5);
    expect(result.weights[0].choice).toBeInstanceOf(EvalBlock);
    let evalBlock = result.weights[0].choice as EvalBlock;
    expect(evalBlock.contents).toBe('some js');
  });

  it('parses many branches with and without weights', function() {
    let testString = '[some js] 5, (test2), (test3) 3}';
    let lexer = new Lexer(testString);
    let result = parseFork(lexer) as ChoiceFork;
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
    assertParseForkGivesSyntaxError('(test) (test 2)}');
  });
});

describe('parseFork', function() {
  it('parses a simple case with a single string branch and no fallback', function() {
    let testString = '@TestRef: 0 -> (foo)}';
    let lexer = new Lexer(testString);
    let result = parseFork(lexer)! as Reference;
    expect(result.id).toBe('TestRef');
    expect(result.referenceMap.size).toBe(1);
    expect(result.referenceMap.get(0)).toStrictEqual(['foo']);
  });

  it('parses a simple case with a single eval block branch and no fallback', function() {
    let testString = '@TestRef: 0 -> [some js]}';
    let result = parseFork(new Lexer(testString)) as Reference;
    expect(result.id).toBe('TestRef');
    expect(result.referenceMap.size).toBe(1);
    expect(result.referenceMap.get(0)).toBeInstanceOf(EvalBlock);
    expect((result.referenceMap.get(0) as EvalBlock).contents).toBe('some js');
    expect(result.reExecute).toBeFalsy()
  });

  it('allows a single branch with a fallback', function() {
    let testString = '@TestRef: 0 -> [some js], (fallback)}';
    let result = parseFork(new Lexer(testString))! as Reference;
    expect(result.id).toBe('TestRef');
    expect(result.referenceMap.size).toBe(1);
    expect(result.referenceMap.get(0)).toBeInstanceOf(EvalBlock);
    expect((result.referenceMap.get(0) as EvalBlock).contents).toBe('some js');
    expect(result.fallbackChoiceFork!).not.toBeNull();
    expect(result.fallbackChoiceFork!.weights).toHaveLength(1);
    let fallbackChoice = result.fallbackChoiceFork!.weights[0].choice as AstNode[];
    expect(fallbackChoice).toStrictEqual(['fallback']);
    expect(result.reExecute).toBeFalsy()
  });

  it('parses multiple branches of all types with fallback', function() {
    let testString = '@TestRef: 0 -> (foo), 1 -> [some js], 2 -> (bar), [some more js]}';
    let result = parseFork(new Lexer(testString)) as Reference;

    expect(result.id).toBe('TestRef');
    expect(result.referenceMap.size).toBe(3);
    expect(result.referenceMap.get(0)).toStrictEqual(['foo']);

    expect(result.referenceMap.get(1)).toBeInstanceOf(EvalBlock);
    expect((result.referenceMap.get(1) as EvalBlock).contents).toBe('some js');

    expect(result.referenceMap.get(2)).toStrictEqual(['bar']);

    expect(result.fallbackChoiceFork!).not.toBeNull();
    expect(result.fallbackChoiceFork!.weights).toHaveLength(1);
    let fallbackChoice = result.fallbackChoiceFork!.weights[0].choice as EvalBlock;
    expect(fallbackChoice).toBeInstanceOf(EvalBlock);
    expect(fallbackChoice.contents).toBe('some more js');
    expect(result.reExecute).toBeFalsy()
  });

  it('parses copy refs', function() {
    let testString = '@TestRef}';
    let lexer = new Lexer(testString);
    let result = parseFork(lexer)! as Reference;
    expect(result).toBeInstanceOf(Reference);
    expect(result.id).toBe('TestRef');
    expect(result.referenceMap.size).toBe(0);
    expect(result.fallbackChoiceFork).toBeNull();
    expect(result.reExecute).toBeFalsy()
  });

  it('throws an error when invalid syntax is used', function() {
    assertParseForkGivesSyntaxError('@TestRef:}');
    assertParseForkGivesSyntaxError('@TestRef: aaskfj}');
    assertParseForkGivesSyntaxError('@TestRef: 0 - > (foo)}');
    assertParseForkGivesSyntaxError('@TestRef: (foo) -> {foo}}');
    assertParseForkGivesSyntaxError('@TestRef: 0 -> (foo),, 1 -> (bar)}');
    assertParseForkGivesSyntaxError('@TestRef: 0,,2 -> (foo), 1 -> (bar)}');
    assertParseForkGivesSyntaxError('@TestRef: 0, 1}');
    assertParseForkGivesSyntaxError('@TestRef: 0 -> (foo), [some js], @TestRef2: 0 -> (foo)}');
    assertParseForkGivesSyntaxError('@TestRef: (foo) 5, 2}');
  });

  it('errors on repeated indexes', function() {
    expect(() => {
      parseFork(new Lexer('@TestRef: 0 -> (foo), 1 -> (bar), 0 -> (biz)'));
    }).toThrowError(BMLDuplicatedRefIndexError);
  });
});

describe('parseDocument', function() {
  it('can parse the kitchen sink test script', function() {
    const bmlScriptPath = path.resolve(__dirname, 'lao_tzu_36.bml');
    const bmlScript = fs.readFileSync(bmlScriptPath).toString();
    let lexer = new Lexer(bmlScript);
    parseDocument(lexer, true);
  });

  it('includes whitespace in plain text', function() {
    let testString = 'testing 1 2\n3';
    let lexer = new Lexer(testString);
    let result = parseDocument(lexer, true);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('testing 1 2\n3')
  });

  it('preserves whitespace around forks', function() {
    let testString = 'foo {(bar)} biz';
    let lexer = new Lexer(testString);
    let result = parseDocument(lexer, true);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('foo ');
    expect(result[1]).toBeInstanceOf(ChoiceFork);
    expect(result[2]).toBe(' biz');
  });

  it('provides literal blocks as plain strings', function() {
    let testString = 'foo [[{(bar)}]]';
    let lexer = new Lexer(testString);
    let result = parseDocument(lexer, true);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('foo {(bar)}')
  });
});
