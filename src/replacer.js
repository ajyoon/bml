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

  /**
   * returns an object of the form {replacement, choiceIndex}
   */
  call() {
    let result = weightedChoose(this.weights);
    return { replacement: result.choice, choiceIndex: result.choiceIndex };
  }

  toString() {
    return `Replacer{replacerFunction: ${this.replacerFunction}}`;
  }
}

exports.Replacer = Replacer;
