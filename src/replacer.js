function defaultReplacer(match, fullText, matchIndex, ...options) {
  return match;
}

class Replacer {
  constructor(replacerFunction) {
    this.replacerFunction = (replacerFunction === undefined) ?
      defaultReplacer : replacerFunction;
  }

  call(match, fullText, matchIndex, ...options) {
    return this.replacerFunction(match, fullText, matchIndex, ...options);
  }

  toString() {
    return `Replacer{replacerFunction: ${this.replacerFunction}}`;
  }
}

exports.Replacer = Replacer;
