import { WeightedChoice, Choice } from './weightedChoice'
import {
  normalizeWeights,
  weightedChoose
} from './rand';

export type ReplacerCallResult = {
  replacement: Choice,
  choiceIndex: number
}

export class Replacer {
  weights: WeightedChoice[];
  identifier: string | null;
  isSilent: boolean;

  constructor(weights: WeightedChoice[], identifier: string | null, isSilent: boolean) {
    this.weights = normalizeWeights(weights);
    this.identifier = identifier;
    this.isSilent = isSilent;
  }

  /**
   * returns an object of the form {replacement: String, choiceIndex: Int}
   */
  call(): ReplacerCallResult {
    let result = weightedChoose(this.weights);
    return { replacement: result.choice, choiceIndex: result.choiceIndex };
  }

  toString(): string {
    return `Replacer{weights: ${this.weights}, `
      + `identifier: ${this.identifier}, isSilent: ${this.isSilent}}`;
  }
}
