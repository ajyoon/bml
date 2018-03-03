let fs = require('fs');

let hljs = require('highlight.js');

let SPLIT_SRC_RE = /(^(.*?)begin (use|using) (\w*?)\n)(.*)/s;

/**
 * Split a bml source into its prelude and body
 *
 * @returns {String[]} The prelude and body of the bml source.
 *     If not prelude is present, return an array of just the body.
 */
function splitBmlCode(source) {
  let match = source.match(SPLIT_SRC_RE);
  if (match === null) {
    return source;
  }
  return [match[1], match[5]];
}

function multiLineApostropheStringMode(hljs) {
  return {
    className: 'string',
    begin: '\'', end: '\'',
    contains: [hljs.BACKSLASH_ESCAPE],
  };
}

function multiLineQuoteStringMode(hljs) {
  return {
    className: 'string',
    begin: '\"', end: '\"',
    contains: [hljs.BACKSLASH_ESCAPE],
  };
}

function bmlEvalMode(hljs) {
  return {
    beginKeywords: 'eval evaluate',
    starts: {
      end: '^}$',
      returnEnd: true,
      subLanguage: ['javascript'],
    },
  };
}

/**
 * hljs mode for a bml `mode` block
 */
function bmlModeMode(hljs) {
  return {
    keywords: 'mode as call',
    begin: '^mode',
    end: '^}$',
    contains: [
      multiLineApostropheStringMode(hljs),
      multiLineQuoteStringMode(hljs),
      hljs.NUMBER_MODE,
      hljs.C_LINE_COMMENT_MODE,
    ],
  };
}

function bmlPreludeLanguage(hljs) {
  return {
    className: 'bml-prelude',
    keywords: 'eval evaluate mode begin use using as',
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      bmlEvalMode(hljs),
      bmlModeMode(hljs),
    ],
  };
}

function bmlLiteralMode(hljs) {
  return {
    className: 'string',
    begin: '\\[\\[',
    end: '\\]\\]',
  };
}

function bmlTransformMode(hljs) {
  return {
    className: 'strong',
    keywords: 'as call',
    begin: '{{',
    end: '}}',
    contains: [
      multiLineApostropheStringMode(hljs),
      multiLineQuoteStringMode(hljs),
      hljs.NUMBER_MODE,
      hljs.C_LINE_COMMENT_MODE,
    ],
  };
}

function bmlBodyLanguage(hljs) {
  return {
    className: 'bml-body',
    contains: [
      bmlLiteralMode(hljs),
      bmlTransformMode(hljs),
      hljs.BACKSLASH_ESCAPE,
    ],
    subLanguage: ['markdown', 'html'],
  };
}

hljs.registerLanguage('bml_prelude', bmlPreludeLanguage);
hljs.registerLanguage('bml_body', bmlBodyLanguage);


function highlightBml(source) {
  splitCode = splitBmlCode(source);
  if (typeof splitCode === 'string') {
    return hljs.highlight('bml_body', source).value;
  }
  let highlightedPrelude = hljs.highlight('bml_prelude', splitCode[0]);
  let highlightedBody = hljs.highlight('bml_body', splitCode[1]);
  return highlightedPrelude.value + '\n' + highlightedBody.value;
}


let bmlSrc = '' + fs.readFileSync('./highlight_sample_2.bml');
let css = '' + fs.readFileSync('./node_modules/highlight.js/styles/railscasts.css');


let highlighted = highlightBml(bmlSrc);

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
`

fs.writeFileSync('out.html', output);
