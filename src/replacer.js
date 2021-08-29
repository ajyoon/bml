const WeightedChoice = require('./weightedChoice.js').WeightedChoice;
const noOp = require('./noOp.js');
const _rand = require('./rand.js');
const normalizeWeights = _rand.normalizeWeights;
const weightedChoose = _rand.weightedChoose;

function defaultReplacer(match, fullText, matchIndex, ...options) {
  return match;
}

class Replacer {
  constructor(choices, includeNoOp, identifier) {
    if (includeNoOp) {
      let choicesWithNoOp = choices.slice();
      choicesWithNoOp.push(new WeightedChoice(noOp, null));
      this.weights = normalizeWeights(choicesWithNoOp);
    } else {
      this.weights = normalizeWeights(choices);
    }
    this.identifier = identifier;
  }

  // Maybe when refs are implemented this will need to return also an index of
  // the selected choice.
  call(match, fullText, matchIndex, ...options) {
    return weightedChoose(this.weights);
  }

  toString() {
    return `Replacer{replacerFunction: ${this.replacerFunction}}`;
  }
}

exports.Replacer = Replacer;
