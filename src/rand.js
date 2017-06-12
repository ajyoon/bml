var Replacer = require('./replacer.js').Replacer;


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

function createWeightedOptionReplacer(choices) {
  var normalizedWeights = normalizeWeights(choices);
  function replacerFunction(match, fullText, matchIndex, option) {
    return weightedChoose(normalizedWeights);
  };
  return new Replacer(replacerFunction);
}

exports.normalizeWeights = normalizeWeights;
exports.weightedChoose = weightedChoose;
exports.createWeightedOptionReplacer = createWeightedOptionReplacer;
