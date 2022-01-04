import expect from 'expect';

import { mergeSettings } from '../src/settings';


describe('mergeSettings', function() {
  it('should handle replacing all fields', function() {
    interface TestObj {
      foo?: boolean;
      bar?: number;
    };
    let originalSettings: TestObj = {
      foo: true,
      bar: 10,
    };
    let merged = mergeSettings(
      originalSettings,
      {
        foo: false
      });
    expect(merged.foo).toBe(false);
    expect(merged.bar).toBe(10);
  });
});
