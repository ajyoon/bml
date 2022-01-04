import { DocumentSettings } from './settings';
import { EvalProvidedSettingsError, EvalProvideError } from './errors';

export type UserDefs = {
  settings?: DocumentSettings,
  funcs: { [index: string]: Function }
}

export function validateAndBuildUserDefs(rawUserDefs: RawUserDefs): UserDefs {
  validateUserDefs(rawUserDefs);
  let userDefs: UserDefs = { funcs: {} };
  for (let [key, value] of Object.entries(rawUserDefs)) {
    if (key === 'settings') {
      userDefs.settings = <DocumentSettings>value;
    } else {
      userDefs.funcs[key] = <Function>value;
    }
  }
  return userDefs;
}

function nullOrUndefined<T>(object: T | undefined | null): object is T {
  return <T>object === undefined || <T>object === null;
}

type RawUserDefs = { [index: string]: any };

function validateSettingField(settings: RawUserDefs, field: string, expectedType: string) {
  const value = settings[field];
  if (!nullOrUndefined(value) && typeof value !== expectedType) {
    throw new EvalProvidedSettingsError('setting.' + field, value);
  }
}

function validateUserDefs(userDefs: RawUserDefs) {
  let settings = userDefs['settings'];
  if (settings) {
    validateSettingField(settings, 'whitespaceCleanup', 'boolean');
    validateSettingField(settings, 'punctuationCleanup', 'boolean');
    validateSettingField(settings, 'capitalizationCleanup', 'boolean');
    validateSettingField(settings, 'version', 'string');
  }
  for (let [key, value] of Object.entries(userDefs)) {
    if (key !== 'settings' && typeof value !== 'function') {
      throw new EvalProvideError(`eval-provided field '${key}' is not a function`);
    }
  }
}
