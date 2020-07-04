const Prism = require('prismjs');
// The docs at https://prismjs.com say to use a babel plugin to load languages,
// but for the life of me I can't get it to work. this approach seems to work
// without importing all the other languages and bloating the bundle size.
require('prismjs/components/prism-markdown');

(function (Prism) {
  Prism.languages.bml = Prism.languages.extend('markdown', {
    'escape': {
      pattern: new RegExp(/\[\[(.*?)\]\]/, 's'),
      alias: 'comment'
    },
    'commandBlock': {
      pattern: new RegExp(/{((?:\\}|(?!}))?.*?)}/, 's'),
      alias: 'important',
      inside: {
        'keyword': {
          pattern: /\b(use|call)\b/
        },
        'number': {
          pattern: /\d+/
        },
        'paren': {
          pattern: new RegExp(/\(((?:\\\+|(?!\)))?.*?)\)/, 's'),
          alias: 'string'
        }
      }
    },
  });
})(Prism);

function highlightBml(source) {
  return Prism.highlight(source, Prism.languages.bml, 'bml');
}

exports.highlightBml = highlightBml;
