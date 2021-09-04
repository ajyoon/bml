const rand = require('./rand.js');
const Replacer = require('./replacer.js').Replacer;


class Rule {
  constructor(matchers, replacer) {
    this.matchers = matchers;
    this.replacer = replacer;
  }
  toString() {
    return `Rule{matchers: ${this.matchers}, replacer: ${this.replacer}}`;
  }
}

exports.Rule = Rule;
