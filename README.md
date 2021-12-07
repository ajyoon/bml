# [bml](https://bml-lang.org)

[![Build Status](https://travis-ci.org/ajyoon/bml.svg?branch=master)](https://app.travis-ci.com/github/ajyoon/bml) [![Coverage Status](https://coveralls.io/repos/github/ajyoon/bml/badge.svg?branch=master)](https://coveralls.io/github/ajyoon/bml?branch=master)

BML is a superset of natural language which applies stochastic
transformations on text.

- [Try it online!](https://bml-lang.org/try)
- [Read the docs](https://bml-lang.org)
- [Install the VS Code extension](https://marketplace.visualstudio.com/items?itemName=bml-lang.bml-vscode)

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
for them being {curly braces}.

Available one-time transformations include:

* choose: `{(x) 20, (y) 30, (z) 50, call someFunc}`
* set the active mode: `{use literal}`

### references

Choices can refer to previously made choices using identifiers and choice indexes with optional fallbacks:

```bml
{Name: (Alice), (Bob), (Someone)} went to the store.
{@Name: 0 -> (She), 1 -> (He), (They)} bought some tofu.
```

---

This project is under active development, and the language itself is not yet stable. Please expect breaking changes.
