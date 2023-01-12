import { FunctionCall } from './functionCall';
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
