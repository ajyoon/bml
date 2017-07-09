/**
 * Default settings. These are passed in to the main bml rendering function.
 */
let defaultSettings = {
  renderMarkdown: false,
  markdownSettings: {},
  version: null,
};

/**
 * Return a new settings object with all the properties defined in newSettings,
 * defaulting to those in originalSettings where absent.
 *
 * @param {Object} originalSettings
 * @param {Object} newSettings
 * @return {void}
 */
function mergeSettings(originalSettings, newSettings) {
  let merged = JSON.parse(JSON.stringify(originalSettings));
  Object.keys(newSettings).forEach(function(key, index) {
    if (merged.hasOwnProperty(key)) {
      merged[key] = newSettings[key];
    }
  });
  return merged;
}

exports.defaultSettings = defaultSettings;
exports.mergeSettings = mergeSettings;
