import { EvalBlock } from './evalBlock';

const MATH_RANDOM_RE = /\bMath\.random\(\)/;
const PROVIDE_RE = /\bprovide\(/;

function checkForMathRandom(code: string) {
  if (MATH_RANDOM_RE.test(code)) {
    console.warn('Eval block appears to use Math.random(); '
      + 'use bml.randomInt or bml.randomFloat instead. '
      + 'See https://bml-lang.org/docs/the-language/eval-api/')
  }
}

function checkForProvide(code: string) {
  if (!PROVIDE_RE.test(code)) {
    console.warn('Eval block appears to never call `provide({})`. '
      + 'This is needed to expose your code to the BML interpreter. '
      + 'See https://bml-lang.org/docs/the-language/eval-api/');
  }
}

/**
 * Run basic sanity checks on an eval block.
 *
 * Currently validates that blocks:
 * - Do not access Math.random
 * - Call `provide()` at least once
 *
 * Validation failures result in warnings logged to console;
 * errors are not thrown.
 */
export function validateEvalBlock(evalBlock: EvalBlock) {
  checkForMathRandom(evalBlock.contents);
  checkForProvide(evalBlock.contents);
}

