### 0.0.2
* [[ Double square brackets ]] are now used for marking blocks of literal text
  in order to prevent collisions with HTML in the previous << double angle bracket >>
  marker
* Fixed a bug with backslash escapes inside literal blocks so literal double square
  brackets can be used [[ inside blocks like this \\]] ]]

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

### 0.0.4
* Remove the explicit bml.renderBML function - to render a string of bml,
  simply call the package as a function.
