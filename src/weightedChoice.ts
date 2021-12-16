import { FunctionCall } from './functionCall';
import noOp from './noOp';


export type Choice = string | FunctionCall | typeof noOp;

/**
 * An outcome with a weight.
 */
export class WeightedChoice {
  choice: Choice;
  weight: number;

  constructor(choice: Choice, weight: number) {
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
