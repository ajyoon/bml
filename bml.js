/*@license BML - BSD 3 Clause License - Source and docs at https://github.com/ajyoon/bml */
var _renderer = require('./src/renderer.js');

module.exports = _renderer.renderBML;
module.exports.renderBML = _renderer.renderBML;
module.exports.defaultSettings = require('./src/settings.js').defaultSettings;
