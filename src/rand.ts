import { WeightedChoice, Choice, sumWeights } from './weightedChoice';
import { NoPossibleChoiceError } from './errors';
import seedrandom from 'seedrandom';


// A module-local seedable random number generator
// The selected seed will be random unless `setRandomSeed()` is called.
// @ts-ignore
let rng = seedrandom(null, { state: true });

export function saveRngState(): Object {
  // @ts-ignore
  return rng.state();
}

export function restoreRngState(state: Object) {
  // @ts-ignore
  rng = seedrandom(null, { state: state });
}

export function setRandomSeed(seed: number) {
  // @ts-ignore
  rng = seedrandom(seed, { state: true });
}

export function normalizeWeights(weightedChoices: WeightedChoice[]): WeightedChoice[] {
  let normalized = [];
  let sum = 0;
  let nullWeightCount = 0;
  for (let w = 0; w < weightedChoices.length; w++) {
    let weightedChoice = weightedChoices[w];
    normalized.push(weightedChoice.clone());
    if (weightedChoice.weight === null) {
      nullWeightCount++;
    } else {
      sum += weightedChoice.weight;
    }
  }
  let nullWeight = (100 - sum) / nullWeightCount;
  for (let n = 0; n < normalized.length; n++) {
    if (normalized[n].weight === null) {
      normalized[n].weight = nullWeight;
    }
  }
  return normalized;
}

export function randomFloat(min: number, max: number): number {
  return (rng() * (max - min)) + min;
}

export function randomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(rng() * (max - min)) + min;
}

/**
 * Randomly choose from an array of weighted choices.
 *
 * The probability of any given `WeightedChoice` being
 * chosen is its weight divided by the sum of all given
 * choices.
 *
 * Returns an object of the form {choice, choiceIndex}
 */
export function weightedChoose(weights: WeightedChoice[]): { choice: Choice, choiceIndex: number } {
  let sum = sumWeights(weights);
  if (sum === 0) {
    throw new NoPossibleChoiceError();
  }
  let progress = 0;
  let pickedValue = randomFloat(0, sum);
  for (let i = 0; i < weights.length; i++) {
    let wc = weights[i];
    progress += wc.weight ?? 0;
    if (progress >= pickedValue) {
      return { choice: wc.choice, choiceIndex: i };
    }
  }
  // If we're still here, something went wrong.
  // Log a warning but try to return a random value anyways.
  console.warn('Unable to pick weighted choice for weights: ' + weights);
  let fallbackIndex = randomInt(0, weights.length);
  return { choice: weights[fallbackIndex].choice, choiceIndex: fallbackIndex };
}

