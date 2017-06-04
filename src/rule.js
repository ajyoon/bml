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

function createRule(matchers, options) {
  var rule = new Rule(matchers);
  rule.getReplacement = rand.getWeightedOptionReplacer(options);
  return rule;
}

exports.createRule = createRule;
exports.Rule = Rule;
