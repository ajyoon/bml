/* @license BML - BSD 3 Clause License - Source at github.com/ajyoon/bml - Docs at bml-lang.org */
import { render } from './renderer';

// This is the entry-point for the browser build. Parcel doesn't
// support elegantly binding top-level definitions to globals, so we
// manually bind to `window` if it exists. `test/releaseTest.js` also
// runs against this file, so monkey-patch a fake window object into
// the global scope to try to imitate the web environment.
let inTestEnv = (typeof window === 'undefined');

if (inTestEnv) {
  // Assume we're running in a release test.
  var window = {};
}
window['bml'] = render;

if (inTestEnv) {
  global['__fakeWindow'] = window;
}


