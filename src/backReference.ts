import { Choice, WeightedChoice } from './weightedChoice';
import { Replacer } from './replacer';

export type BackReferenceMap = Map<number, Choice>;

export class BackReference {

  referredIdentifier: string;
  choiceMap: BackReferenceMap;
  fallbackReplacer: Replacer | null;

  constructor(referredIdentifier: string, choiceMap: BackReferenceMap, fallbackChocies: WeightedChoice[]) {
    this.referredIdentifier = referredIdentifier;
    this.choiceMap = choiceMap;
    if (fallbackChocies.length) {
      this.fallbackReplacer = new Replacer(fallbackChocies, null, false);
    } else {
      this.fallbackReplacer = null;
    }
  }
}
