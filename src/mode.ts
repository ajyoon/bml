import { prettyPrintArray } from './prettyPrinting';
import { Rule } from './rule';


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
