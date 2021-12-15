import stringUtils from './stringUtils.ts';

class IllegalStateError extends Error {
  constructor(message: string) {
    super(message + ' This is a bug. Please report at https://github.com/ajyoon/bml/issues');
    this.name = 'IllegalStateError';
    Object.setPrototypeOf(this, IllegalStateError.prototype);
  }
}

class JavascriptSyntaxError extends Error {
  constructor(bmlDoc: string, errorIndex: number) {
    let message = 'Syntax error found while parsing bml javascript at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(message);
    this.name = 'JavascriptSyntaxError';
    Object.setPrototypeOf(this, JavascriptSyntaxError.prototype);
  }
}

class BMLSyntaxError extends Error {
  constructor(message: string | null, bmlDoc: string, errorIndex: number) {
    let resolvedMsg = (message || 'Syntax error found while parsing bml') +
      ' at ' + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(resolvedMsg);
    this.name = 'BMLSyntaxError';
    Object.setPrototypeOf(this, BMLSyntaxError.prototype);
  }
}

class BMLDuplicatedRefIndexError extends Error {
  constructor(refIdentifier: string, choiceIndex: number, bmlDoc: string, errorIndex: number) {
    let msg = `Duplicated reference index ${choiceIndex} for reference ${refIdentifier} `
      + `at ${stringUtils.lineColumnString(bmlDoc, errorIndex)}`;
    super(msg);
    this.name = 'BMLDuplicatedRefIndexError';
    Object.setPrototypeOf(this, BMLDuplicatedRefIndexError.prototype);
  }
}

class BMLDuplicatedRefError extends Error {
  constructor(refIdentifier: string, bmlDoc: string, errorIndex: number) {
    let msg = `Duplicated reference ${refIdentifier} `
      + `at ${stringUtils.lineColumnString(bmlDoc, errorIndex)}`;
    super(msg);
    this.name = 'BMLDuplicatedRefError';
    Object.setPrototypeOf(this, BMLDuplicatedRefError.prototype);
  }
}

class BMLNameError extends Error {
  constructor(name: string, bmlDoc: string, errorIndex: number) {
    let msg = 'Unknown name: "' + name + '" at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(msg);
    this.name = 'BMLNameError';
    Object.setPrototypeOf(this, BMLNameError.prototype);
  }
}

class UnknownModeError extends Error {
  constructor(modeName: string, bmlDoc: string, errorIndex: number) {
    let msg = 'Unknown mode \'' + modeName + '\' at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(msg);
    this.name = 'UnknownModeError';
    Object.setPrototypeOf(this, UnknownModeError.prototype);
  }
}

class UnknownTransformError extends Error {
  constructor(bmlDoc: string, errorIndex: number) {
    let msg = 'Unknown transform at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(msg);
    this.name = 'UnknownTransformError';
    Object.setPrototypeOf(this, UnknownTransformError.prototype);
  }
}

class FunctionNotFoundError extends Error {
  constructor(functionName: string, bmlDoc: string, errorIndex: number) {
    let msg = 'Attempted to call unknown function "' + functionName + '" at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(msg);
    this.name = 'FunctionNotFoundError';
    Object.setPrototypeOf(this, FunctionNotFoundError.prototype);
  }
}

class NotAFunctionError extends Error {
  constructor(functionName: string, bmlDoc: string, errorIndex: number) {
    let msg = 'Attempted to call non-function "' + functionName + '" at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(msg);
    this.name = 'NotAFunctionError';
    Object.setPrototypeOf(this, NotAFunctionError.prototype);
  }
}

exports.IllegalStateError = IllegalStateError;
exports.JavascriptSyntaxError = JavascriptSyntaxError;
exports.BMLSyntaxError = BMLSyntaxError;
exports.BMLDuplicatedRefIndexError = BMLDuplicatedRefIndexError;
exports.BMLDuplicatedRefError = BMLDuplicatedRefError;
exports.BMLNameError = BMLNameError;
exports.UnknownModeError = UnknownModeError;
exports.UnknownTransformError = UnknownTransformError;
exports.FunctionNotFoundError = FunctionNotFoundError;
exports.NotAFunctionError = NotAFunctionError;
