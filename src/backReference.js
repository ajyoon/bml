class BackReference {
  /**
   * choiceMap is a *Map* (not simply object) of int choice indexes to bound results.
   */
  constructor(referredIdentifier, choiceMap, fallback) {
    this.referredIdentifier = referredIdentifier;
    this.choiceMap = choiceMap;
    this.fallback = fallback;
  }
}

exports.BackReference = BackReference;
