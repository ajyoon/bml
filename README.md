```
eval {
    // arbitrary javascript
    // global bml interpreter settings
    settings = {
        renderMarkdown: false,  // Since md is the target
    };
    function someFunc(match, string, matchIndex) {
        return 'some replacement string';
    }
    // Copy the prelude into literal text.
    function copyPrelude(match, string, matchIndex) {
        return '```\n' + string.slice(0, matchIndex) + '```\n';
    }
}
mode literal {
    // No rules
}
{use literal}
```


# bml

[![Build Status](https://travis-ci.org/ajyoon/bml.svg?branch=master)](https://travis-ci.org/ajyoon/bml) [![Coverage Status](https://coveralls.io/repos/github/ajyoon/bml/badge.svg?branch=master)](https://coveralls.io/github/ajyoon/bml?branch=master) [![Built with Spacemacs](https://cdn.rawgit.com/syl20bnr/spacemacs/442d025779da2f62fc86c2082703697714db6514/assets/spacemacs-badge.svg)](http://spacemacs.org)


BML is a superset of natural language which applies stochastic transformations
on text. Words and strings can be used as triggers for weighted random
replacements and arbitrary transformations specified with javascript.

## setup

To install:
```
npm install bml
```

To run the test suite:
```
npm test
```

To bundle for the web:
```
npm run build
```

To use in the web:
```html
<script src="/path/to/bml.bundle.js"></script>
...
<script>
document.getElementById("someTargetId").innerHTML =
    bml("some bml loaded as a js string");
</script>
```

## the language

A prelude section is used to define maps and evaluate arbitrary
javascript. An eval block provides a location to execute arbitrary code
and define reusable functions. maps link words in the text to other words
with weights controlling their relative likelihood and may also call functions
either defined inline or in the eval block.

Strings can be escaped with [[double square bracket delimiters.]] and backslashes \\.

The text body can also apply one-time transformations, the common marker
for them being {double curly braces}.

Available one-time transformations include:

* choose: `{{x} 20, {y} 30, {z} 50, call someFunc}`
* using: `{using literal}`

## syntax highlighting

Experimental syntax highlighting for the browser is supported.
```
npm run buildHighlighting
```
```html
<script src="/path/to/bml_highlighting.bundle.js"></script>
```

Be warned, this currently pulls in _all_ of `highlight.js`, including a whole
lot of languages irrelevant to bml. Pruning this to drastically reduce the
bundle size is high on the list of upcoming improvements.

---

This is a very early, very unstable project. Lots of fixes and improvements coming soon!

By the way, as you may have guessed, this is a BML document. To generate this readme,
run `node readmeBuilder.js`!
