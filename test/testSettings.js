var assert = require('assert');
var fs = require('fs');

var mergeSettings = require('../src/settings.js').mergeSettings;


describe('mergeSettings', function() {
  it('should handle replacing all fields', function() {
    var originalSettings = {
      renderMarkdown: false,
      contextSize: 5
    };
    var merged = mergeSettings(
      originalSettings,
      {
          renderMarkdown: true,
          contextSize: 1000
      });
    assert.equal(true, merged.renderMarkdown);
    assert.equal(1000, merged.contextSize);
  });
});
