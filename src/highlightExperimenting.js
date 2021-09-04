const fs = require('fs');

const highlighting = require('./highlighting.js');

let bmlSrc = '' + fs.readFileSync('./sample.bml');
let css = '' + fs.readFileSync('./node_modules/highlight.js/styles/darcula.css');

let highlighted = highlighting.highlightBml(bmlSrc);

let output = `
<html>
<style>
${css}
</style>

<body>
<pre>
<code id="code-block" class="hljs">
${highlighted}
</code>
</pre>
</body>
</html>
`;

fs.writeFileSync('out.html', output);
