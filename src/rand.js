let WeightedChoice = require('./weightedChoice.js').WeightedChoice;
let seedrandom = require('seedrandom');

// A module-local seedable random number generator
// The selected seed will be random unless `setRandomSeed()` is called.
let rng = seedrandom();

function setRandomSeed(seed) {
  rng = seedrandom(seed);
}

function normalizeWeights(weightedChoices) {
  let normalized = [];
  let sum = 0;
  let nullWeightCount = 0;
  for (let w = 0; w < weightedChoices.length; w++) {
    let weightedChoice = weightedChoices[w];
    normalized.push(weightedChoice.clone());
    if (weightedChoice.weight === null) {
      nullWeightCount++;
    } else {
      sum += weightedChoice.weight;
    }
  }
  let nullWeight = (100 - sum) / nullWeightCount;
  for (let n = 0; n < normalized.length; n++) {
    if (normalized[n].weight === null) {
      normalized[n].weight = nullWeight;
    }
  }
  return normalized;
}

function randomFloat(min, max) {
  return (rng() * (max - min)) + min;
}

function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(rng() * (max - min)) + min;
}

/**
 * Randomly choose from an array of weighted choices.
 *
 * The probability of any given `WeightedChoice` being
 * chosen is its weight divided by the sum of all given
 * choices.
 */
function weightedChoose(weights) {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i].weight;
  }
  let progress = 0;
  let pickedValue = randomFloat(0, sum);
  for (let w = 0; w < weights.length; w++) {
    progress += weights[w].weight;
    if (progress >= pickedValue) {
      return weights[w].choice;
    }
  }
  // If we're still here, something went wrong.
  // Log a warning but try to return a random value anyways.
  console.warn('Unable to pick weighted choice for weights: ' + weights);
  return weights[randomInt(0, weights.length)].choice;
}

exports.setRandomSeed = setRandomSeed;
exports.randomFloat = randomFloat;
exports.randomInt = randomInt;
exports.normalizeWeights = normalizeWeights;
exports.weightedChoose = weightedChoose;
