const rand = require('./rand.ts');
const Replacer = require('./replacer.ts').Replacer;


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