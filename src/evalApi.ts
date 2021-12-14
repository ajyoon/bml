const rand = require('./rand.ts');
const WeightedChoice = require('./weightedChoice.ts').WeightedChoice;

/**
 * This module is exposed to BML script `eval` blocks in a `bml` object namespace.
 */

exports.WeightedChoice = require('./weightedChoice.ts').WeightedChoice;
exports.weightedChoose = rand.weightedChoose;
exports.randomInt = rand.randomInt;
exports.randomFloat = rand.randomFloat;

exports.api = {
  WeightedChoice: WeightedChoice,
  weightedChoose: rand.weightedChoose,
  randomInt: rand.randomInt,
  randomFloat: rand.randomFloat
};

