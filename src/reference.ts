import { Choice, WeightedChoice } from './weightedChoice';
import { Replacer } from './replacer';

export type ReferenceMap = Map<number, Choice>;

export class Reference {

  referredIdentifier: string;
  choiceMap: ReferenceMap;
  fallbackReplacer: Replacer | null;

  constructor(referredIdentifier: string, choiceMap: ReferenceMap, fallbackChocies: WeightedChoice[]) {
    this.referredIdentifier = referredIdentifier;
    this.choiceMap = choiceMap;
    if (fallbackChocies.length) {
      this.fallbackReplacer = new Replacer(fallbackChocies, null, false);
    } else {
      this.fallbackReplacer = null;
    }
  }
}
