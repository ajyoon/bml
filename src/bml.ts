/* @license BML - BSD 3 Clause License - Source at github.com/ajyoon/bml - Docs at bml-lang.org */
import { render } from './renderer';
import { RenderSettings } from './settings';
import { analyze } from './analysis';

// Wrap the main entrypoint function so we can attach further API parts to it
export function entryFunc(bmlDocumentString: string,
  renderSettings: RenderSettings | null): string {
  return render(bmlDocumentString, renderSettings);
}

entryFunc.analyze = analyze;

// satisfy the module gods?
module.exports = entryFunc;
export default entryFunc;
