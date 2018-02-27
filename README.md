

```
evaluate {
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
mode initial {
    'evaluate' as 'eval'
}
mode literal {
    // No rules
}
begin using initial

```


[![Build Status](https://travis-ci.org/ajyoon/bml.svg?branch=master)](https://travis-ci.org/ajyoon/bml)

# bml

BML is a superset of natural language which applies stochastic transformations
on text. Words and strings can be used as triggers for weighted random
replacements and arbitrary transformations specified with javascript.

To install:
```
npm install bml
```

To run the test suite:
```
npm test
# If this doesn't work, install mocha globally with npm install -g mocha
```

To bundle for the web:
```
npm webpack
# If this doesn't work, install webpack globally with npm install -g webpack
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

A prelude section is used to define maps and eval arbitrary
javascript. An eval block provides a location to execute arbitrary code
and define reusable functions. maps link words in the text to other words
with weights controlling their relative likelihood and may also call functions
either defined inline or in the evaluate block.

Strings can be escaped with [[double square bracket delimiters.]] and backslashes \\.

The text body can also apply one-time transformations, the common marker
for them being {{double curly braces}}.

Available one-time transformations include:

* choose: `{{'x' 20, 'y' 30, 'z' 50, call someFunc}}`
* using: `{{using literal}}`

This is a very early, very unstable project. Lots of fixes and improvements coming soon!

By the way, as you may have guessed, this is a BML document. To generate this readme,
run `node readmeBuilder.js`!
