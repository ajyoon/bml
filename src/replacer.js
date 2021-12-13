const WeightedChoice = require('./weightedChoice.js').WeightedChoice;
const _rand = require('./rand.ts');
const normalizeWeights = _rand.normalizeWeights;
const weightedChoose = _rand.weightedChoose;

class Replacer {
  constructor(choices, identifier, isSilent) {
    this.weights = normalizeWeights(choices);
    this.identifier = identifier;
    this.isSilent = isSilent;
  }

  /**
   * returns an object of the form {replacement: String, choiceIndex: Int}
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
