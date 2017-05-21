function JavascriptSyntaxError(message) {
  this.name = 'JavascriptSyntaxError';
  this.message = message || 'Syntax error found while parsing bml javascript.';
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

exports.JavascriptSyntaxError = JavascriptSyntaxError;
exports.BMLSyntaxError = BMLSyntaxError;
