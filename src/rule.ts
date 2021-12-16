import { Replacer } from './replacer';


export class Rule {
  matchers: RegExp[];
  replacer: Replacer;

  constructor(matchers: RegExp[], replacer: Replacer) {
    this.matchers = matchers;
    this.replacer = replacer;
  }
  toString() {
    return `Rule{matchers: ${this.matchers}, replacer: ${this.replacer}}`;
  }
}
