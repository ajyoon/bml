import expect from 'expect';
import { defaultBMLSettings } from '../src/settings';
import { UserDefs, validateAndBuildUserDefs } from '../src/userDefs';
import { EvalProvidedSettingsError, EvalProvideError } from '../src/errors';

describe('validateAndBuildUserDefs', function() {

  it('doesnt error on well-formed settings and defs', function() {
    validateAndBuildUserDefs({
      settings: defaultBMLSettings,
      someFunc: () => { }
    });
  });

  it('errors on malformed markdownSettings', function() {
    expect(() => validateAndBuildUserDefs({
      settings: {
        markdownSettings: 0
      }
    })).toThrow(EvalProvidedSettingsError);
  });

  it('errors on malformed whitespaceCleanup', function() {
    expect(() => validateAndBuildUserDefs({
      settings: {
        whitespaceCleanup: 0
      }
    })).toThrow(EvalProvidedSettingsError);
  });

  it('errors on malformed punctuationCleanup', function() {
    expect(() => validateAndBuildUserDefs({
      settings: {
        punctuationCleanup: 123
      }
    })).toThrow(EvalProvidedSettingsError);
  });

  it('errors on malformed capitalizationCleanup', function() {
    expect(() => validateAndBuildUserDefs({
      settings: {
        capitalizationCleanup: {}
      }
    })).toThrow(EvalProvidedSettingsError);
  });

  it('errors on malformed version', function() {
    expect(() => validateAndBuildUserDefs({
      settings: {
        version: 1.23
      }
    })).toThrow(EvalProvidedSettingsError);
  });

  it('when any non-settings field is not a function', function() {
    expect(() => validateAndBuildUserDefs({
      test: 123
    })).toThrow(new EvalProvideError("eval-provided field 'test' is not a function"));
  });

  it('reassigns fields to fit UserDefs', function() {
    let func = () => { };
    let rawUserDefs = {
      settings: {
        version: 'testVersion'
      },
      someFunc: func
    };
    let expectedUserDefs: UserDefs = {
      settings: rawUserDefs.settings,
      funcs: {
        someFunc: func
      }
    }
    expect(validateAndBuildUserDefs(rawUserDefs)).toStrictEqual(expectedUserDefs);
  });
});
