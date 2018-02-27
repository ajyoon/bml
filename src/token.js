class Token {
  constructor(tokenType, index, string) {
    this.tokenType = tokenType;
    this.index = index;
    this.string = string;
  }

  toString() {
    return `Token{tokenType: ${this.tokenType.toString().slice(7, -1)}, index: ${this.index}, `
      + `string: '${this.string}'}`;
  }
}
exports.Token = Token;
