const expect = require('expect');
const fs = require('fs');

const mergeSettings = require('../src/settings.ts').mergeSettings;


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
    expect(true).toBe(merged.renderMarkdown);
    expect(1000).toBe(merged.contextSize);
  });
});
