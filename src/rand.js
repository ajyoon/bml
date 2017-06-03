function normalizeWeights(weights) {
  var normalized = [];
  var sum = 0;
  var nullChanceCount = 0;
  for (w_index in weights) {
    weight = weights[w_index];
    normalized.push({option: weight.option, chance: weight.chance});
    if (weight.chance === null) {
      nullChanceCount++;
    } else {
      sum += weight.chance;
    }
  }
  if (sum < 100) {
    var nullChance = (100 - sum) / nullChanceCount;
    for (normWeight in normalized) {
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
  for (i in weights) {
    sum += i.chance;
  }
  var progress = 0;
  var pickedValue = randomFloat(0, sum);
  for (i in weights) {
    progress += weights[i].chance;
    if (progress >= sum) {
      return weights[i].option;
    }
  }
  // If we're still here, something went wrong.
  // Log a warning but try to return a random value anyways.
  process.emitWarning('Unable to pick randomChoice for weights: ' + weights);
  return weights[randomInt(0, weights.length)].option;
}


exports.normalizeWeights = normalizeWeights;
exports.weightedChoice = weightedChoice;
