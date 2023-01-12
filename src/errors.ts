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

export class EvalBoundSettingsError extends Error {
  constructor(field: string, value: any) {
    super(`Eval binding of settings field '${field}' of '${value}' is invalid`)
    this.name = 'EvalBoundSettingsError';
    Object.setPrototypeOf(this, EvalBoundSettingsError.prototype);
  }
}

export class EvalBindingError extends Error {
  constructor(key: string) {
    super(`Eval binding ${key} was bound multiple times.`)
    this.name = 'EvalBindingError';
    Object.setPrototypeOf(this, EvalBindingError.prototype);
  }
}
