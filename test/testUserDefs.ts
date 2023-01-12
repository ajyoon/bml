import expect from 'expect';
import { defaultBMLSettings } from '../src/settings';
import { validateUserDefs } from '../src/userDefs';
import { EvalBoundSettingsError } from '../src/errors';

describe('validateUserDefs', function() {
  it('doesnt error on well-formed settings and defs', function() {
    validateUserDefs({
      settings: defaultBMLSettings,
      someFunc: () => { }
    });
  });

  it('errors on malformed whitespaceCleanup', function() {
    expect(() => validateUserDefs({
      settings: {
        whitespaceCleanup: 0
      }
    })).toThrow(EvalBoundSettingsError);
  });

  it('errors on malformed punctuationCleanup', function() {
    expect(() => validateUserDefs({
      settings: {
        punctuationCleanup: 123
      }
    })).toThrow(EvalBoundSettingsError);
  });

  it('errors on malformed capitalizationCleanup', function() {
    expect(() => validateUserDefs({
      settings: {
        capitalizationCleanup: {}
      }
    })).toThrow(EvalBoundSettingsError);
  });
});
