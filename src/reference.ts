import { Choice, WeightedChoice } from './weightedChoice';
import { ChoiceFork } from './choiceFork.ts';

export type ReferenceMap = Map<number, Choice>;

export class Reference {

  id: string;
  choiceMap: ReferenceMap;
  fallbackChoiceFork: ChoiceFork | null;

  constructor(id: string, choiceMap: ReferenceMap, fallbackChocies: WeightedChoice[]) {
    this.id = id;
    this.choiceMap = choiceMap;
    if (fallbackChocies.length) {
      this.fallbackChoiceFork = new ChoiceFork(fallbackChocies, null, false);
    } else {
      this.fallbackChoiceFork = null;
    }
  }
}
