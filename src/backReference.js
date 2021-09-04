class BackReference {
  /**
   * choiceMap is a map of form { choiceIndex: Int, boundResult: String }
   */
  constructor(referredIdentifier, choiceMap, fallback) {
    this.referredIdentifier = referredIdentifier;
    this.choiceMap = choiceMap;
    this.fallback = fallback;
  }
}

exports.BackReference = BackReference;
