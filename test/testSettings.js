const assert = require('assert');
const fs = require('fs');

const mergeSettings = require('../src/settings.js').mergeSettings;


describe('mergeSettings', function() {
  it('should handle replacing all fields', function() {
    let originalSettings = {
      renderMarkdown: false,
      contextSize: 5,
    };
    let merged = mergeSettings(
      originalSettings,
      {
          renderMarkdown: true,
          contextSize: 1000,
      });
    assert.strictEqual(true, merged.renderMarkdown);
    assert.strictEqual(1000, merged.contextSize);
  });
});
