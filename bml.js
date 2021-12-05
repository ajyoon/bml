/* @license BML - BSD 3 Clause License - Source at github.com/ajyoon/bml - Docs at bml-lang.org */
const _renderer = require('./src/renderer.js');

module.exports = _renderer.render;
module.exports.defaultSettings = require('./src/settings.js').defaultSettings;
