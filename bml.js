/* @license BML - BSD 3 Clause License - Source and docs at https://github.com/ajyoon/bml */
const _renderer = require('./src/renderer.js');

module.exports = _renderer.render;
module.exports.defaultSettings = require('./src/settings.js').defaultSettings;
