/**
 * An outcome with a weight.
 */
class WeightedChoice {
  constructor(choice, weight) {
    this.choice = choice;
    this.weight = weight;
  }

  toString() {
    return `WeightedChoice{choice: ${this.choice}, weight: ${this.weight}}`;
  }

  /* Create a new WeightedChoice object with the same properties as this one. */
  clone() {
    return new WeightedChoice(this.choice, this.weight);
  }
}

exports.WeightedChoice = WeightedChoice;
