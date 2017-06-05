var rand = require('./rand.js');
var Replacer = require('./replacer.js').Replacer;


class Rule {
  constructor(matchers) {
    this.matchers = matchers;
    // Default replacer is a no-op
    this.replacer = new Replacer(function(match, ...rest) {return match;});
  }
}

function createRule(matchers, options) {
  var rule = new Rule(matchers);
  rule.replacer = rand.createWeightedOptionReplacer(options);
  return rule;
}

exports.createRule = createRule;
exports.Rule = Rule;
