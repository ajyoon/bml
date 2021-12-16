import * as stringUtils from './stringUtils';

export class IllegalStateError extends Error {
  constructor(message: string) {
    super(message + ' This is a bug. Please report at https://github.com/ajyoon/bml/issues');
    this.name = 'IllegalStateError';
    Object.setPrototypeOf(this, IllegalStateError.prototype);
  }
}

export class JavascriptSyntaxError extends Error {
  constructor(bmlDoc: string, errorIndex: number) {
    let message = 'Syntax error found while parsing bml javascript at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(message);
    this.name = 'JavascriptSyntaxError';
    Object.setPrototypeOf(this, JavascriptSyntaxError.prototype);
  }
}

export class BMLSyntaxError extends Error {
  constructor(message: string | null, bmlDoc: string, errorIndex: number) {
    let resolvedMsg = (message || 'Syntax error found while parsing bml') +
      ' at ' + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(resolvedMsg);
    this.name = 'BMLSyntaxError';
    Object.setPrototypeOf(this, BMLSyntaxError.prototype);
  }
}

export class BMLDuplicatedRefIndexError extends Error {
  constructor(refIdentifier: string, choiceIndex: number, bmlDoc: string, errorIndex: number) {
    let msg = `Duplicated reference index ${choiceIndex} for reference ${refIdentifier} `
      + `at ${stringUtils.lineColumnString(bmlDoc, errorIndex)}`;
    super(msg);
    this.name = 'BMLDuplicatedRefIndexError';
    Object.setPrototypeOf(this, BMLDuplicatedRefIndexError.prototype);
  }
}

export class BMLDuplicatedRefError extends Error {
  constructor(refIdentifier: string, bmlDoc: string, errorIndex: number) {
    let msg = `Duplicated reference ${refIdentifier} `
      + `at ${stringUtils.lineColumnString(bmlDoc, errorIndex)}`;
    super(msg);
    this.name = 'BMLDuplicatedRefError';
    Object.setPrototypeOf(this, BMLDuplicatedRefError.prototype);
  }
}

export class BMLNameError extends Error {
  constructor(name: string, bmlDoc: string, errorIndex: number) {
    let msg = 'Unknown name: "' + name + '" at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(msg);
    this.name = 'BMLNameError';
    Object.setPrototypeOf(this, BMLNameError.prototype);
  }
}

export class UnknownModeError extends Error {
  constructor(modeName: string, bmlDoc: string, errorIndex: number) {
    let msg = 'Unknown mode \'' + modeName + '\' at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(msg);
    this.name = 'UnknownModeError';
    Object.setPrototypeOf(this, UnknownModeError.prototype);
  }
}

export class UnknownTransformError extends Error {
  constructor(bmlDoc: string, errorIndex: number) {
    let msg = 'Unknown transform at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(msg);
    this.name = 'UnknownTransformError';
    Object.setPrototypeOf(this, UnknownTransformError.prototype);
  }
}

export class FunctionNotFoundError extends Error {
  constructor(functionName: string, bmlDoc: string, errorIndex: number) {
    let msg = 'Attempted to call unknown function "' + functionName + '" at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(msg);
    this.name = 'FunctionNotFoundError';
    Object.setPrototypeOf(this, FunctionNotFoundError.prototype);
  }
}

export class NotAFunctionError extends Error {
  constructor(functionName: string, bmlDoc: string, errorIndex: number) {
    let msg = 'Attempted to call non-function "' + functionName + '" at '
      + stringUtils.lineColumnString(bmlDoc, errorIndex);
    super(msg);
    this.name = 'NotAFunctionError';
    Object.setPrototypeOf(this, NotAFunctionError.prototype);
  }
}
