var stringUtils = require('./stringUtils.js');

function JavascriptSyntaxError(string, charIndex) {
  this.name = 'JavascriptSyntaxError';
  this.message = 'Syntax error found while parsing bml javascript at '
                 + stringUtils.lineColumnString(string, charIndex);
  var error = new Error(this.message);
  error.name = this.name;
  this.stack = error.stack;
}
JavascriptSyntaxError.prototype = Object.create(Error.prototype);

function BMLSyntaxError(message) {
  this.name = 'BMLSyntaxError';
  this.message = message || 'Syntax error found while parsing bml.';
  var error = new Error(this.message);
  error.name = this.name;
  this.stack = error.stack;
}
BMLSyntaxError.prototype = Object.create(Error.prototype);


function BMLNameError(name, string, charIndex) {
  this.name = 'BMLNameError';
  this.message = 'Unknown name: "' + name + '" at '
    + stringUtils.lineColumnString(string, charIndex);
  var error = new Error(this.message);
  error.name = this.name;
  this.stack = error.stack;
}
JavascriptSyntaxError.prototype = Object.create(Error.prototype);


function UnknownModeError(string, charIndex, modeName) {
  this.name = 'JavascriptSyntaxError';
  this.message = "Unknown mode '" + modeName + "' at "
    + stringUtils.lineColumnString(string, charIndex);
  var error = new Error(this.message);
  error.name = this.name;
  this.stack = error.stack;
}
UnknownModeError.prototype = Object.create(Error.prototype);

exports.JavascriptSyntaxError = JavascriptSyntaxError;
exports.BMLSyntaxError = BMLSyntaxError;
exports.BMLNameError = BMLNameError;
exports.UnknownModeError = UnknownModeError;
