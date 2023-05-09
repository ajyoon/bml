const bml = require('bml');

/*
 * A script for comparing branch counts from static analysis against
 * real bml outputs. This necessarily is not effective for outputs
 * with high branch counts.
 */

const assert = require('assert');

let bmlScript = `
// {#foo: (x), (y)}
// {#bar: (a), (b), (c)}
// {{@foo}, {@bar}}
// {{@foo}}

{{foo: (x), (y)}, {(a), (b), (c)}}
{@foo}
`;

const ITERS = 1000;
let acc = new Set();
for (let i = 0; i < ITERS; i++) {
  acc.add(bml(bmlScript));
}
console.log(`After ${ITERS} iterations, I found ${acc.size} unique outputs`);
// debugging
let fixedOutputs = [];
for (let output of acc) {
  fixedOutputs.push(output.replaceAll('\n', ' ').toUpperCase());
}
fixedOutputs.sort();
fixedOutputs.forEach(o => console.log(o));
