import { WeightedChoice, Choice } from './weightedChoice'
import {
  normalizeWeights,
  weightedChoose
} from './rand';

export type ChoiceForkCallResult = {
  replacement: Choice,
  choiceIndex: number
}

export class ChoiceFork {
  weights: WeightedChoice[];
  identifier: string | null;
  isSilent: boolean;
  isSet: boolean;

  constructor(weights: WeightedChoice[], identifier: string | null, isSilent: boolean, isSet: boolean) {
    this.weights = normalizeWeights(weights);
    this.identifier = identifier;
    this.isSilent = isSilent;
    this.isSet = isSet;
  }

  /**
   * returns an object of the form {replacement: String, choiceIndex: Int}
   */
  call(): ChoiceForkCallResult {
    let result = weightedChoose(this.weights);
    return { replacement: result.choice, choiceIndex: result.choiceIndex };
  }

  toString(): string {
    return `ChoiceFork{weights: ${this.weights}, `
      + `identifier: ${this.identifier}, isSilent: ${this.isSilent}}`;
  }
}
