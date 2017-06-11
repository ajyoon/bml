"use strict";

var fs = require('fs');
var bml = require('bml');

var sampleText = '' + fs.readFileSync('sample.bml');
var renderedText = bml.renderBML(sampleText);


fs.writeFile("README.md", renderedText, function(err) {
  if(err) {
    return console.log(err);
  }
  console.log("README file built successfully.");
});
