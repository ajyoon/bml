import { prettyPrintArray } from './prettyPrinting.ts';
import { Rule } from './rule.ts';


export class Mode {
  name: string;
  rules: Rule[] = [];

  constructor(name: string) {
    this.name = name;
  }

  toString() {
    return `Mode{name: '${this.name}', `
      + `rules: ${prettyPrintArray(this.rules)}}`;
  }
}

export type ModeMap = { [index: string]: Mode };
