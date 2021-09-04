const prettyPrinting = require('./prettyPrinting.js');


class Mode {
  constructor(name) {
    this.name = name;
    this.rules = [];
  }

  toString() {
    return `Mode{name: '${this.name}', `
      + `rules: ${prettyPrinting.prettyPrintArray(this.rules)}}`;
  }
}

exports.Mode = Mode;
