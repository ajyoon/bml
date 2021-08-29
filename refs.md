# Choice References (language feature design sketch)

## Motivations

Natural language is highly stateful, but as it stands today, BML programs are largely stateless. Inline choices and rule applications occur in isolation and without knowledge of the outcomes of other chance operations. Consider a case where a BML construct may want to allow a gendered variation in contexts using pronouns:

```bml
{(Alice), (Bob)} went to the library. She/He was home by noon.
```

BML today can handle such cases by extending the choice to include the wider context:

```bml
{(Alice went to the library. She), (Bob went to the library. He)} was home by noon.
```

but this can be repetitive and inelegant. Even worse, this approach cannot support additional choices placed within the expanded choice:

```bml
{(Alice), (Bob)} {(went), (drove), (walked)} to the library. She/He was home by noon.

...can only be expressed with even more repetition like so:

{(Alice {(went), (drove), (walked)} to the library. She), (Bob {(went), (drove), (walked)} to the library. He)} was home by noon.
```

While global state can be written and read in replacement functions, this is fragile and unwieldy. A new syntax-driven language feature is needed to properly support such patterns.

## Requirements

- Choices must be able to reference other choice outcomes
- This syntax must account for nested choices and the fact that, in this context, not all choice blocks are executed, so fallback behavior must be supported.
- At the same time, choice refs should _not_ be locally scoped within nested choices; a top-level choice should be able to reference arbitrarily nested choices.
- Choice references should be restricted to the order they appear in the document, as this is BML's evaluation order.

## Restrictions

- For simplicity it is probably best to make a choice be able to reference at most one other choice.

## Ideas

### Label + Index

Simple case:

```bml
{Character: (Alice) 10, (Bob) 5} {(went), (drove), (walked)} to the library.
{@Character: 0 -> (She), 1 -> (He)} was home by noon.
```

With a fallback choice:

```bml
{@Character: 0 -> (She), 1 -> (He), (fallback choice 1)}
```

Multiple fallback choices can be implemented with a nested choice:

```bml
{@Character: 0 -> (She), 1 -> (He), ({(fallback choice 1), (fallback choice 2)})}
```

Multiple choices:

```bml
{Character: (Alice) 10, (Bob) 5} {(went), (drove), (walked)} to the {Destination: (library), (store)}.
{@Character: 0 -> (She), 1 -> (He)} {@Destination: 0 -> (got lots of books), 1 -> (bought groceries for dinner)}.
```

This can also be used for things like optional quotation marks:

```bml
What does it mean{Quot: (, "), ( that)} success is as dangerous as failure{@Quot: 0 -> (")}?
```

Maybe the choice indexes can be elided to assume ascending index order?

```bml
What does it mean{Quot: (, "), ( that)} success is as dangerous as failure{@Quot: (")}?
```

but this is ambiguous with fallback choices as expressed above.

Maybe include special common macro-like things, like to copy a whole choice result potentially including nested choices `{@LabelName}`. Maybe allows filters too? like `{@LabelName | lowercaseFirst}`. Filters would probably need to also apply to fallback choices too.

Note that this syntax does (clunkily) support compound refs with `{@Choice1: 0 -> ({@Choice2: 0 -> (foo)})}` giving "if Choice1 and Choice2 were 0 then foo", but it does not support negative logic "if Choice1 was 0 and Choice2 was _not_ 0 then foo".


#### Example from Tao Te Ching 13:

Source from Stephen Mitchell translation:

```bml
Success is as dangerous as failure.
Hope is as hollow as fear.

What does it mean that success is as dangerous as failure?
...
```

introducing the alternate Ursula K Le Guin translation might look something like:

```bml
{SuccessVsFailure: (Success is as {DorR: (dangerous), (risky)} as failure), (To be in favor or disgrace is to live in fear)}.
{HopeVsFear: (Hope is as hollow as fear), (To take the body seriously is to admit one can suffer)}.


What does it mean that {@SuccessVsFailure: 
    0 -> (success is as {@DorR:
            0 -> (dangerous),
            1 -> (risky)
        } as failure),
    1 -> (to be in favor or disgrace is to live in fear)
}?
...
```

## Logic syntax

Here choice labels work the same as above, but the ref syntax is different. A few ideas might look like:

```bml
{Character: (Alice) 10, (Bob) 5} {(went), (drove), (walked)} to the library.
{if @Character was 0 then (She) elif 1 then (He) else (fallback)}
{match @Character.0 (She), .1 (He)}
{if @Charaacter = 0 (She), = 1 (He)}
```

This feels clunky to me though.
