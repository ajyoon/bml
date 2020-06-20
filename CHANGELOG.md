# Changelog

### 0.0.14-dev: MAJOR BREAKING CHANGES
* Replaces double-brace syntax with single braces. This affects inline choice blocks and mode switch blocks. Also replaces single/double quoted string syntax with parentheses so that all string literals outside `eval` blocks are now simply surrounded with parentheses. This helps simplify natural language (where quotation marks are commonly used) and allows the syntax for nested replacements to be much more elegant.
  | before                       | after                        |
  |------------------------------|------------------------------|
  | `{{'a' 10, 'b'}}`            | `{(a) 10, (b)}`              |
  | `{{use anotherMode}}`        | `{use anotherMode}`          |
  | `'foo' as 'bar' 5, call foo` | `(foo) as (bar) 5, call foo` |

  For migrating existing BML text, the following emacs regexps (in this order) have proven helpful:
  1. `{{ -> {`
  2. `}} -> }`
  3. `'\([^{"\\]*?\)' -> (\1)`
  4. `"\([^{\\]*?\)" -> (\1)`
* Remove the `begin` statement; instead the first non-prelude-y text will cause the prelude to end. To start with an active mode, simply call the `{use someMode}` command.
* Remove the `using` variant of the `use` keyword
* Support recursive rendering within replacements, both in inline choices and in rule replacements. For instance:
  ```bml
  mode main {
      (recurse!) as (just kidding), (outer {(inner 1), (inner 2)})
  }
  {use main}
  recurse!
  a {(simple inline), ({(complex), (fancy)} recursive)} inline choice
  ```

### 0.0.13
* Expose `randomInt` and `randomFloat` to eval blocks.

### 0.0.12
* Fix bug where random float generation was rounding results to integers,
  causing incorrect behavior when using floating-point or small values
  in replacement choice weights.
* Add full support for random seed pinning for fully reproducible bml
  render artifacts
* Document some of the API provided to `eval` blocks

### 0.0.11
* Added experimental support for built-in javascript utils,
  starting with exposing `weightedChoose()` and `WeightedChoice`.
* Fixed a bug causing version checks to emit a warning when
  a correct version was provided.

### 0.0.10
* Changed `evaluate` keyword to `eval`
* Added experimental support for syntax highlighting in browsers
  using a custom language definition in highlightjs

### 0.0.9
* Added a command line interface and man page
  (requires a global install with `npm install -g bml`)

### 0.0.8
* Support double quotes in inline replacement options.
  `hello {{"double" 60, 'single'}} quoted world!`
* Support bml documents which do not have preludes.
  Note that this changes the default behavior around malformed preludes;
  while previously a missing prelude or a prelude whose ending cannot be
  found would trigger a `BMLSyntaxError`, the behavior now is to consider
  it to not be a prelude at all, but normal bml text.
* Add `settings.version`: an optional setting to specify a bml version
  for a document. If the specified setting does not match the running
  bml version, a warning is logged. If no version number is specified,
  a warning is logged informing that unexpected behavior may occur.

### 0.0.7
* Fix regression breaking regex matchers

### 0.0.6
* Support double-quotes in addition to single quotes
  for all string literals
* support escaping special tokens in regex matchers without
  needing a double-backslash. e.g. `r'\\\\s+' -> r'\\s+'`
* a major internal refactor of all parsers increases long-term
  stability and flexibility of the language implementation.

### 0.0.5
* Fix silly bug causing no-op options to never occur

### 0.0.4
* Remove the explicit bml.renderBML function - to render a string of bml,
  simply call the package as a function.
* Implement automatic no-op options in choice rules.
  Rules now have a default chance to not do anything.
  A no-op option is automatically inserted for all choice rules
  with a weight of `null`, to share an equal probability as all
  other options without explicit weights.
* Fix bug in renderer causing halt after first match found
* Add settings.markdownSettings. Allows users to specify settings
  to pass to marked.js at render time.

### 0.0.3
* Add WeightedChoice class and use it in place of weight objects.
  `{option: ___, weight: ___} -> new WeightedChoice(choice, weight)`
  The new class has a `choice` property in place of an `option` one.
* rename `rand.weightedChoice() -> rand.weightedChoose()`
* Implement toString() methods in all classes
* Fix rand.normalizeWeights and rand.weightedChoose not correctly calculating values.
* Regex matchers can be specified with the character `r` immediately before
  the opening quote of a matcher string. Internally, strings not prepended with an `r`
  are still stored as regexps, but they are fully escaped. Regex flags cannot
  be set by users - they will always be the single sticky-y flag.
  For example, `r'.*'` gives the RegExp `/.*/y`, while `'.*'` gives
  the RegExp `/\.\*/y`.
* Transform/replacer functions now take a RegExp match array.

### 0.0.2
* [[ Double square brackets ]] are now used for marking blocks of literal text
  in order to prevent collisions with HTML in the previous << double angle bracket >>
  marker
* Fixed a bug with backslash escapes inside literal blocks so literal double square
  brackets can be used [[ inside blocks like this \\]] ]]
