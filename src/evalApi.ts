import * as rand from './rand';
import { WeightedChoice } from './weightedChoice';

/**
 * This module is exposed to BML script `eval` blocks in a `bml` object namespace.
 */

export const api = {
  WeightedChoice: WeightedChoice,
  weightedChoose: rand.weightedChoose,
  randomInt: rand.randomInt,
  randomFloat: rand.randomFloat
}
