let fs = require('fs');

let hljs = require('highlight.js');

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


function bmlLiteralMode(hljs) {
  return {
    className: 'string',
    begin: '\\[\\[',
    end: '\\]\\]',
    excludeBegin: true,
    excludeEnd: true,
  };
}

function bmlTransformMode(hljs) {
  return {
    className: 'strong',
    keywords: 'as call',
    begin: '{{',
    end: '}}',
    relevance: 10,
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

function bmlEvalMode(hljs) {
  return {
    beginKeywords: 'eval',
    starts: {
      end: '^}$',
      returnEnd: true,
      subLanguage: ['javascript'],
    },
  };
}

function bmlModeOpeningMode(hljs) {
  return {
    keywords: 'mode',
    begin: '^mode',
    end: '{',
    contains: [
      hljs.inherit(hljs.TITLE_MODE, {begin: hljs.IDENT_RE}),
    ],
  };
}

function bmlBeginMode(hljs) {
  return {
    keywords: 'begin use using',
    begin: '^begin (use|using)',
    end: '\w+',
    endsParent: true,
    relevance: 100,
  };
}

function bmlLanguage(hljs) {
  return {
    className: 'bml-prelude',
    keywords: 'eval mode begin use using as call r',
    end: '^begin (use|using) (\w+)$',
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      bmlEvalMode(hljs),
      multiLineApostropheStringMode(hljs),
      multiLineQuoteStringMode(hljs),
      hljs.NUMBER_MODE,
      hljs.C_LINE_COMMENT_MODE,
      bmlModeOpeningMode(hljs),
      bmlBeginMode(hljs),
    ],
    starts: bmlBodyLanguage(hljs),
  };
}

hljs.registerLanguage('bml', bmlLanguage);
hljs.registerLanguage('bml_body_only', bmlBodyLanguage);

function highlightBml(source) {
  return hljs.highlightAuto(source, ['bml', 'bml_body_only']).value;
}

let bmlSrc = '' + fs.readFileSync('./highlight_sample_2.bml');
let css = '' + fs.readFileSync('./node_modules/highlight.js/styles/darcula.css');


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
`;

fs.writeFileSync('out.html', output);
