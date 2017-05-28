var rand = require('./rand.js');


class Rule {
  constructor(matchers) {
    this.matchers = matchers;
    this.getReplacement.replacerType = 'no-op';
  }

  getReplacement(match, fullText, matchIndex, option) {
    return match;
  }
}

function getWeightedOptionReplacer(choices) {
  var normalizedWeights = rand.normalizeWeights(choices);
  function replacer(match, fullText, matchIndex, option) {
    return rand.weightedChoice(normalizedWeights);
  };
  replacer.replacerType = 'weightedChoice';
  return replacer;
}

exports.Rule = Rule;
exports.getWeightedOptionReplacer = getWeightedOptionReplacer;
