'use strict';

const fs = require('fs');
const bml = require('./bml.js');

let sampleText = '' + fs.readFileSync('sample.bml');
let renderedText = bml(sampleText);


fs.writeFile('README.md', renderedText, function(err) {
  if (err) {
    return console.log(err);
  }
  console.log('README file built successfully.');
});
