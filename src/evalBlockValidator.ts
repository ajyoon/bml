import { EvalBlock } from './evalBlock';

const MATH_RANDOM_RE = /\bMath\.random\(\)/;

function checkForMathRandom(code: string) {
  if (MATH_RANDOM_RE.test(code)) {
    console.warn('Eval block appears to use Math.random(); '
      + 'use bml.randomInt or bml.randomFloat instead. '
      + 'See https://bml-lang.org/docs/the-language/eval-api/')
  }
}

/**
 * Run basic sanity checks on an eval block.
 *
 * Currently validates that blocks:
 * - Do not access Math.random
 *
 * Validation failures result in warnings logged to console;
 * errors are not thrown.
 */
export function validateEvalBlock(evalBlock: EvalBlock) {
  checkForMathRandom(evalBlock.contents);
}

