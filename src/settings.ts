/**
 * Default settings. These are passed in to the main bml rendering function.
 */
const defaultBMLSettings = {
  markdownSettings: {},
  version: null,
};

const defaultRenderSettings = {
  randomSeed: null,
  allowEval: true,
  renderMarkdown: false,
  whitespaceCleanup: true,
};

/**
 * Return a new settings object with all the properties defined in newSettings,
 * defaulting to those in originalSettings where absent.
 *
 * If `newSettings` is falsy, return `originalSettings` unmodified.
 *
 * @param {Object} originalSettings
 * @param {Object} newSettings
 * @return {Object}
 */
function mergeSettings(originalSettings, newSettings) {
  if (!newSettings) {
    return originalSettings;
  }
  let merged = JSON.parse(JSON.stringify(originalSettings));
  Object.keys(newSettings).forEach(function(key, index) {
    if (merged.hasOwnProperty(key)) {
      merged[key] = newSettings[key];
    }
  });
  return merged;
}

exports.defaultBMLSettings = defaultBMLSettings;
exports.defaultRenderSettings = defaultRenderSettings;
exports.mergeSettings = mergeSettings;
