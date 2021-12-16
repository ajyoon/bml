import { Choice } from './weightedChoice';

export type BackReferenceMap = Map<number, string>;

export class BackReference {

  referredIdentifier: string;
  choiceMap: BackReferenceMap;
  fallback: Choice | null;

  constructor(referredIdentifier: string, choiceMap: BackReferenceMap, fallback: Choice | null) {
    this.referredIdentifier = referredIdentifier;
    this.choiceMap = choiceMap;
    this.fallback = fallback;
  }
}
