var rand = require('./rand.js');


class Rule {
  constructor(matcher) {
    this.matcher = matcher;
  }

  getReplacement(match, context, option) {
    return match;
  }
}

function getWeightedOptionReplacer(choices) {
  var normalizedWeights = rand.normalizeWeights;
  return function(match, context, option) {
    return rand.weightedChoice(normalizedWeights);
  };
}
