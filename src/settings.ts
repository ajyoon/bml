export interface DocumentSettings {
  /**
   * Whether to perform a post-processing step cleaning up whitespace.
   */
  whitespaceCleanup?: boolean | null;

  /**
   * Whether to perform a post-processing step repositioning
   * punctuation marks according to *some* English grammar rules.
   */
  punctuationCleanup?: boolean | null;

  /**
   * Whether to perform basic capitalization correction for words
   * following sentence-ending punctuation.
   */
  capitalizationCleanup?: boolean | null;

  /**
   * Whether to correct English indefinite articles (a / an)
   */
  indefiniteArticleCleanup?: boolean | null;
}

export interface RenderSettings {
  /**
   * The random seed to use for this render.
   *
   * Can be any type, as this is fed directly to the `seedrandom`
   * library, which converts the object to a string and uses that as
   * the actual seed.
   */
  randomSeed?: number | null;

  /**
   * Whether to disable `eval` blocks in the document.
   *
   * This can be useful for security purposes.
   */
  allowEval?: boolean | null;

  /**
   * The working directory used for imports in this render.
   *
   * If the document uses imports, this should generally be set to the
   * absolute path of the document file's directory.
   */
  workingDir?: string | null;
}

/**
 * Default settings. These are passed in to the main bml rendering function.
 */
export const defaultBMLSettings: DocumentSettings = {
  whitespaceCleanup: true,
  punctuationCleanup: true,
  capitalizationCleanup: true,
  indefiniteArticleCleanup: true,
};

export const defaultRenderSettings: RenderSettings = {
  randomSeed: null,
  allowEval: true,
  workingDir: null,
};

/**
 * Return a new settings object with all the properties defined in newSettings,
 * defaulting to those in originalSettings where absent.
 *
 * If `newSettings` is falsy, return `originalSettings` unmodified.
 */
export function mergeSettings<T>(originalSettings: T, newSettings: T | null | undefined): T {
  return Object.assign({}, originalSettings, newSettings);
}
