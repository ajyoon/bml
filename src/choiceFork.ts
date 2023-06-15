import { WeightedChoice, Choice, sumWeights } from './weightedChoice'
import {
  normalizeWeights,
  weightedChoose
} from './rand';
import { NoPossibleChoiceError, InvalidForkWeightsError } from './errors';

export type ChoiceForkCallResult = {
  replacement: Choice,
  choiceIndex: number
}

export class ChoiceFork {
  weights: WeightedChoice[];
  initWeights: number[];
  identifier: string | null;
  isSilent: boolean;
  isSet: boolean;

  constructor(weights: WeightedChoice[], identifier: string | null, isSilent: boolean, isSet: boolean) {
    this.weights = normalizeWeights(weights);
    this.validateWeights();
    this.initWeights = this.weights.map((w) => (w.weight!));
    this.identifier = identifier;
    this.isSilent = isSilent;
    this.isSet = isSet;
  }

  /**
   * returns an object of the form {replacement: String, choiceIndex: Int}
   */
  call(): ChoiceForkCallResult {
    let result;
    try {
      result = weightedChoose(this.weights);
    } catch (error) {
      if (error instanceof NoPossibleChoiceError && this.isSet) {
        console.warn(`Set '${this.identifier}' is exhausted; resetting weights.`)
        this.resetWeights();
        return this.call();
      } else {
        throw error;
      }
    }
    if (this.isSet) {
      this.weights[result.choiceIndex].weight = 0;
    }
    return { replacement: result.choice, choiceIndex: result.choiceIndex };
  }

  private resetWeights() {
    for (let [idx, val] of this.weights.entries()) {
      val.weight = this.initWeights[idx];
    }
  }

  private validateWeights() {
    if (sumWeights(this.weights) === 0) {
      throw new InvalidForkWeightsError();
    }
  }

  toString(): string {
    return `ChoiceFork{weights: ${this.weights}, `
      + `identifier: ${this.identifier}, isSilent: ${this.isSilent}, isSet: ${this.isSet}}`;
  }
}
