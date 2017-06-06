var Replacer = require('./replacer.js').Replacer;


function normalizeWeights(weights) {
  var normalized = [];
  var sum = 0;
  var nullChanceCount = 0;
  for (var w_index in weights) {
    var weight = weights[w_index];
    normalized.push({option: weight.option, chance: weight.chance});
    if (weight.chance === null) {
      nullChanceCount++;
    } else {
      sum += weight.chance;
    }
  }
  if (sum < 100) {
    var nullChance = (100 - sum) / nullChanceCount;
    for (var normWeight in normalized) {
      if (normWeight.chance === null) {
        normWeight.chance = nullChance;
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

function weightedChoice(weights) {
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
  console.log('Unable to pick randomChoice for weights: ' + weights);
  return weights[randomInt(0, weights.length)].option;
}

function createWeightedOptionReplacer(choices) {
  var normalizedWeights = normalizeWeights(choices);
  function replacerFunction(match, fullText, matchIndex, option) {
    return weightedChoice(normalizedWeights);
  };
  return new Replacer(replacerFunction);
}

exports.normalizeWeights = normalizeWeights;
exports.weightedChoice = weightedChoice;
exports.createWeightedOptionReplacer = createWeightedOptionReplacer;
