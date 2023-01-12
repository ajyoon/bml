import { DocumentSettings } from './settings';
import { EvalProvidedSettingsError } from './errors';


function nullOrUndefined<T>(object: T | undefined | null): object is T {
  return <T>object === undefined || <T>object === null;
}

export type UserDefs = { [index: string]: any };

function validateSettingField(settings: UserDefs, field: string, expectedType: string) {
  const value = settings[field];
  if (!nullOrUndefined(value) && typeof value !== expectedType) {
    throw new EvalProvidedSettingsError('setting.' + field, value);
  }
}

export function validateUserDefs(userDefs: UserDefs) {
  let settings = userDefs['settings'];
  if (settings) {
    validateSettingField(settings, 'whitespaceCleanup', 'boolean');
    validateSettingField(settings, 'punctuationCleanup', 'boolean');
    validateSettingField(settings, 'capitalizationCleanup', 'boolean');
    validateSettingField(settings, 'version', 'string');
  }
}
