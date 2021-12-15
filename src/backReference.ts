export type BackReferenceMap = Map<number, string>;

export class BackReference {

  referredIdentifier: string;
  choiceMap: BackReferenceMap;
  fallback: string | null;

  constructor(referredIdentifier: string, choiceMap: BackReferenceMap, fallback: string | null) {
    this.referredIdentifier = referredIdentifier;
    this.choiceMap = choiceMap;
    this.fallback = fallback;
  }
}
