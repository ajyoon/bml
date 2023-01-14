/* @license BML - BSD 3 Clause License - Source at github.com/ajyoon/bml - Docs at bml-lang.org */
import { render } from './renderer';
import { analyze } from './analysis';

window['bml'] = render;
window.bml.analyze = analyze;
