class EvalBlock {
  constructor(string) {
    this.string = string;
  }

  toString() {
    return `EvalBlock('${this.string}')`;
  }
}

exports.EvalBlock = EvalBlock;
