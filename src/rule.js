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

function createRule(matchers, options) {
  var rule = new Rule(matchers);
  rule.getReplacement = getWeightedOptionReplacer(options);
  return rule;
}

exports.createRule = createRule;
exports.Rule = Rule;
exports.getWeightedOptionReplacer = getWeightedOptionReplacer;
