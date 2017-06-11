var Replacer = require('./replacer.js').Replacer;


function normalizeWeights(weightedChoices) {
  var normalized = [];
  var sum = 0;
  var nullWeightCount = 0;
  for (var w_index in weightedChoices) {
    var weightedChoice = weightedChoices[w_index];
    normalized.push(weightedChoice.clone());
    if (weightedChoice.weight === null) {
      nullWeightCount++;
    } else {
      sum += weightedChoice.weight;
    }
  }
  if (sum < 100) {
    var nullWeight = (100 - sum) / nullWeightCount;
    for (var normWeight in normalized) {
      if (normWeight.weight === null) {
        normWeight.weight = nullWeight;
      }
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
  for (var i in weights) {
    sum += i.chance;
  }
  var progress = 0;
  var pickedValue = randomFloat(0, sum);
  for (var w in weights) {
    progress += weights[w].chance;
    if (progress >= sum) {
      return weights[w].option;
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
