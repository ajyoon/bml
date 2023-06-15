import { Choice, WeightedChoice } from './weightedChoice';
import { ChoiceFork } from './choiceFork';

export type ReferenceMap = Map<number, Choice>;

export class Reference {

  id: string;
  referenceMap: ReferenceMap;
  fallbackChoiceFork: ChoiceFork | null;
  reExecute: boolean;

  constructor(id: string, choiceMap: ReferenceMap, fallbackChocies: WeightedChoice[], reExecute: boolean) {
    this.id = id;
    this.referenceMap = choiceMap;
    if (fallbackChocies.length) {
      this.fallbackChoiceFork = new ChoiceFork(fallbackChocies, null, false, false);
    } else {
      this.fallbackChoiceFork = null;
    }
    this.reExecute = reExecute;
    if (reExecute) {
      if (choiceMap.size || fallbackChocies.length) {
        throw new Error('Got reExecute=true but mappings were provided. ' +
          'This error should be caught earlier in the parser.')
      }
    }
  }
}
