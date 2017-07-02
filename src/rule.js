var rand = require('./rand.js');
var Replacer = require('./replacer.js').Replacer;


class Rule {
  constructor(matchers) {
    this.matchers = matchers;
    // Default replacer is a no-op
    this.replacer = new Replacer(function(match, ...rest) {return match;});
  }
  toString() {
    return `Rule{matchers: ${this.matchers}, replacer: ${this.replacer}}`;
  }
}

function createRule(matchers, choices) {
  var rule = new Rule(matchers);
  rule.replacer = rand.createWeightedOptionReplacer(choices, true);
  return rule;
}

exports.createRule = createRule;
exports.Rule = Rule;
