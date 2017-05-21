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

function UnknownModeError(string, charIndex, modeName) {
  this.name = 'JavascriptSyntaxError';
  this.message = "Unknown mode '" + modeName + "' at "
    + stringUtils.lineColumnString(string, charIndex);
  var error = new Error(this.message);
  error.name = this.name;
  this.stack = error.stack;
}

exports.JavascriptSyntaxError = JavascriptSyntaxError;
exports.BMLSyntaxError = BMLSyntaxError;
exports.UnknownModeError = UnknownModeError;
