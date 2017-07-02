/**
 * Default settings. These are passed in to the main bml rendering function.
 */
var defaultSettings = {
  renderMarkdown: false,
  markdownSettings: {}
};

/**
 * Return a new settings object with all the properties defined in newSettings,
 * defaulting to those in originalSettings where absent.
 */
function mergeSettings(originalSettings, newSettings) {
  var merged = JSON.parse(JSON.stringify(originalSettings));
  Object.keys(newSettings).forEach(function(key, index) {
    if (merged.hasOwnProperty(key)) {
      merged[key] = newSettings[key];
    }
  });
  return merged;
}

exports.defaultSettings = defaultSettings;
exports.mergeSettings = mergeSettings;
