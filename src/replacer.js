function defaultReplacer(match, fullText, matchIndex, option) {
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
}

exports.Replacer = Replacer;
