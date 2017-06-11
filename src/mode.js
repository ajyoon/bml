class Mode {
  constructor(name) {
    this.name = name;
    this.rules = [];
  }

  toString() {
    return `Mode{name: ${this.name}, rules: ${this.rules}}`;
  }
}

exports.Mode = Mode;
