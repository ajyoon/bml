var Replacer = require('./replacer.js').Replacer;
var WeightedChoice = require('./weightedChoice.js').WeightedChoice;
var noOp = require('./noOp.js');


function normalizeWeights(weightedChoices) {
  var normalized = [];
  var sum = 0;
  var nullWeightCount = 0;
  for (var w = 0; w < weightedChoices.length; w++) {
    var weightedChoice = weightedChoices[w];
    normalized.push(weightedChoice.clone());
    if (weightedChoice.weight === null) {
      nullWeightCount++;
    } else {
      sum += weightedChoice.weight;
    }
  }
  var nullWeight = (100 - sum) / nullWeightCount;
  for (var n = 0; n < normalized.length; n++) {
    if (normalized[n].weight === null) {
      normalized[n].weight = nullWeight;
    }
  }
  return normalized;
}

function randomFloat(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function weightedChoose(weights) {
  var sum = 0;
  for (var i = 0; i < weights.length; i++) {
    sum += weights[i].weight;
  }
  var progress = 0;
  var pickedValue = randomFloat(0, sum);
  for (var w = 0; w < weights.length; w++) {
    progress += weights[w].weight;
    if (progress >= pickedValue) {
      return weights[w].choice;
    }
  }
  // If we're still here, something went wrong.
  // Log a warning but try to return a random value anyways.
  console.log('Unable to pick weighted choice for weights: ' + weights);
  return weights[randomInt(0, weights.length)].choice;
}

/**
 * Create a Replacer which selects from an array of `WeightedChoice`s
 *
 * The sum of the probabilities in `choices` should be less than 100.
 * All `WeightedChoice`s with a weight of `null` share an equal probability
 * within whatever probability remains in the input choices.
 *
 * If includeNoOp is `true`, a noOp option will be inserted with weight `null`,
 * to be normalized as described above.
 */
function createWeightedOptionReplacer(choices, includeNoOp) {
  var normalizedWeights;
  if (includeNoOp === true) {
    var choicesWithNoOp = choices.slice();
    choicesWithNoOp.push(new WeightedChoice(noOp, null));
    normalizedWeights = normalizeWeights(choicesWithNoOp);
  } else {
    normalizedWeights = normalizeWeights(choices);
  }
  function replacerFunction(match, fullText, matchIndex, ...options) {
    return weightedChoose(normalizedWeights);
  };
  return new Replacer(replacerFunction);
}

exports.normalizeWeights = normalizeWeights;
exports.weightedChoose = weightedChoose;
exports.createWeightedOptionReplacer = createWeightedOptionReplacer;
