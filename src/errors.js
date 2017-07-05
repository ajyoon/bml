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

function BMLSyntaxError(message, string, charIndex) {
  this.name = 'BMLSyntaxError';
  if (message) {
    this.message = message;
    if (charIndex) {
      this.message += ' at ' + stringUtils.lineColumnString(string, charIndex);
    }
  } else {
    this.message = 'Syntax error found while parsing bml';
    if (charIndex) {
      this.message += ' at ' + stringUtils.lineColumnString(string, charIndex);
    }
  }
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


function UnknownTransformError(string, charIndex) {
  this.name = 'UnknownTransformError';
  this.message = "Unknown transform at "
    + stringUtils.lineColumnString(string, charIndex);
  var error = new Error(this.message);
  error.name = this.name;
  this.stack = error.stack;
}
UnknownTransformError.prototype = Object.create(Error.prototype);


exports.JavascriptSyntaxError = JavascriptSyntaxError;
exports.BMLSyntaxError = BMLSyntaxError;
exports.BMLNameError = BMLNameError;
exports.UnknownModeError = UnknownModeError;
exports.UnknownTransformError = UnknownTransformError;
