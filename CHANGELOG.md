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
