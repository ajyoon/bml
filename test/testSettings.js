const expect = require('chai').expect;
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
    expect(true).to.equal(merged.renderMarkdown);
    expect(1000).to.equal(merged.contextSize);
  });
});
