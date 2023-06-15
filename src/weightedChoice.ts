import { EvalBlock } from './evalBlock';
import { AstNode } from './ast';


export type Choice = EvalBlock | AstNode[];

/**
 * An outcome with a weight.
 */
export class WeightedChoice {
  choice: Choice;
  weight: number | null;

  constructor(choice: Choice, weight: number | null) {
    this.choice = choice;
    this.weight = weight;
  }

  toString(): string {
    return `WeightedChoice{choice: ${String(this.choice)}, weight: ${this.weight}}`;
  }

  /* Create a new WeightedChoice object with the same properties as this one. */
  clone(): WeightedChoice {
    return new WeightedChoice(this.choice, this.weight);
  }
}

export function sumWeights(weights: WeightedChoice[]) {
  // Note that if weights have been normalized, as they are in `ChoiceFork`s,
  // `wc.weight` will always be non-null here so the default should never occur.
  return weights.reduce((acc, val) => acc + (val.weight ?? 0), 0);
}
