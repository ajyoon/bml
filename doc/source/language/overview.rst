.. _marked docs: https://github.com/markedjs/marked/blob/master/USING_ADVANCED.md#options
.. _regex match: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions

========================
the blur markup language
========================

The blur markup language (``bml``) is a hybrid language combining javascript,
``bml`` constructs, and whatever target format you use. Markdown and HTML are
supported out of the box.


.. _document-structure:

document structure
==================

A ``bml`` document consists of two sections: an optional
:ref:`prelude<the-prelude>` and a body. If a prelude is given, it must always
end with a :ref:`begin` statement. If no :ref:`begin` statement is found, the
document is interpreted as having only a :ref:`body <the-body>`::

  [prelude]

  [begin statement]

  [body]


.. _the-prelude:

the prelude
===========

A ``bml`` prelude consists of:

* any number of :ref:`eval` blocks
* any number of :ref:`modes <mode>`
* a :ref:`begin` statement

a basic example::

  eval {
      settings = {
          renderMarkdown: true
      };
      function someFunc(match, string, matchIndex) {
          return 'some replacement';
      }
  }

  mode someMode {
      {x} as {y}
  }

  begin using someMode


.. _eval:

the eval block
==============

The ``eval`` block allows you to evaluate arbitrary javascript prior to
interpreting the document body. This is primarily useful for two purposes:

* overriding default ``bml`` settings
* defining :ref:`replacement functions <replacement-functions>`

The entire contents of the eval block will be passed directly to a javascript
``eval()`` call.

.. _bml-settings:

bml settings
------------

The ``settings`` object is a javascript object of setting overrides that may be
declared in the :ref:`eval` block::

  eval {
      settings = {
          renderMarkdown: true
      };
  }

If it is created during prelude evaluation, all provided settings will override
their defaults.

+--------------------+---------+----------------------------------------------+
|setting             |default  |purpose                                       |
+--------------------+---------+----------------------------------------------+
|``renderMarkdown``  |``false``|Whether or not the rendered ``bml`` document  |
|                    |         |should be post-processed as markdown. If      |
|                    |         |``true``, the output will be processed as     |
|                    |         |markdown and output as HTML.                  |
+--------------------+---------+----------------------------------------------+
|``markdownSettings``|``{}``   |A settings object to be passed to ``marked``, |
|                    |         |the markdown processor built in to ``bml``.   |
|                    |         |For details on what settings can be passed to |
|                    |         |this, see the `marked docs`_. If              |
|                    |         |``renderMarkdown`` is ``false``, this has no  |
|                    |         |effect.                                       |
+--------------------+---------+----------------------------------------------+
|``version``         |``null`` |The ``bml`` version number the document is    |
|                    |         |written for. If present, ``bml`` will check   |
|                    |         |that this matches the version running. If it  |
|                    |         |does not, a warning will be logged to the     |
|                    |         |console. If this is omitted, a warning will be|
|                    |         |logged to the console that this is            |
|                    |         |recommended.                                  |
+--------------------+---------+----------------------------------------------+


.. _replacement-functions:

replacement functions
---------------------

Replacement functions allow you to perform nontrivial substitutions in your
document. They may be used by modes in :ref:`rules` and in :ref:`commands
<commands>`.

Replacement functions have the following signature: ::

  function replacementFunction(
      match: String[], string: String, index: Number) -> String

* ``match`` is a `regex match`_ array. Most often, you'll just want to access
  ``match[0]`` since it contains the entire matched text. In the case of
  :ref:`commands <commands>`, this will always be simply
  ``['']``.
* ``string`` is the entire raw text of the bml document, including the prelude.
* ``index`` is the index in ``string`` where the match was found.

The function should return a string which is to replace the text found at the
point.

.. warning::

   Any replacement function which might use random elements should use the
   :ref:`provided eval API <provided-eval-api>` for random operations.
   Direct invokation of ``Math.random()`` will undermine bml's ability
   to create reproducible document versions pinned to random seeds.

provided eval api
-----------------

Some functions are automatically provided to the scope in which eval blocks
are evaluated during bml rendering.
See :ref:`its reference here <provided-eval-api>`

.. _mode:

modes
=====

A mode has a name and consists of any number of :ref:`rules`. ::

  mode someModeName {
      // a rule
      // another rule
  }

.. _rules:

rules
=====

Each rule consists of a list of matchers and a list of replacements.
During rendering, all matchers for the active rule are tested across
the ``bml`` :ref:`body <the-body>`, and when matches are found they
are replaced using the replacer defined in the corresponding rule.

A matcher can be a simple string (any text enclosed in curly braces)
or, when prefixed by the character ``r``, a regular expression. ::

  mode someModeName {
      {a matcher} as {foo}
      r{a regex matcher} as {foo}
  }

Multiple matchers can apply to a single rule, making the previous example
equivalent to: ::

  mode someModeName {
      {a matcher}, r{a regex matcher} as {foo}
  }

Replacements can be literal strings or references to replacement
:ref:`replacement functions <replacement-functions>` defined in eval blocks.
Replacement functions references must be prefaced with the keyword ``call``.
Here we have a rule which matches on all words starting with the letter *A* and
uses a replacement function to capitalize the word. ::

  eval {
      // capitalize the match contents
      function capitalize(match, string, index) {
          return match[0].toUpperCase();
      }
  }

  mode capitalizingWordsStartingWithA {
      r{\s[aA](\w?)} as call capitalize
  }

Multiple possible replacements can be specified. The unmodified matched text is
always included as a possible replacement. ::

  {foo} as {bar}, call baz

A weighted random choice is taken between all replacement options. By default,
all options are equally likely to be chosen, but this can be overridden by
providing numerical weights to replacements. ::

  {foo} as {bar} 40

The weights given are considered to be percentages of all possible outcomes. All remaining probability is distributed equally among all options which have no explicit value (always including the unmodified matched text as an option).

+----------------------------------------+-------------------------------------+
|rule                                    |meaning                              |
+----------------------------------------+-------------------------------------+
|``{foo} as {bar}``                      |{foo} 50% of the time, {bar} 50% of  |
|                                        |the time.                            |
+----------------------------------------+-------------------------------------+
|``{foo} as {bar} 60``                   |{foo} 40% of the time, {bar} 60% of  |
|                                        |the time                             |
+----------------------------------------+-------------------------------------+
|``{foo} as {bar} 50, {baz}``            |{foo} 25% of the time, {bar} 50% of  |
|                                        |the time, {baz} 25% of the time.     |
|                                        |Notice how the remaining unclaimed   |
|                                        |50% of probability is distributed    |
|                                        |evenly among all other options.      |
+----------------------------------------+-------------------------------------+
|``{foo} as {bar} 40, call someFunc 60`` |{bar} 40% of the time, call          |
|                                        |``someFunc`` 60% of the time. Note   |
|                                        |that, because 100% of probability has|
|                                        |been claimed, {foo} will never be    |
|                                        |chosen.                              |
+----------------------------------------+-------------------------------------+


If the sum of all weights is greater than or equal to ``100``, the unmodified
matched text will never be chosen.

.. note::

   If the sum of all weights exceeds 100, the values will be normalized such
   that their sum is 100. For example, ``{foo} as {bar} 100, {baz} 900`` is
   equivalent to ``{foo} as {bar} 10, {baz} 90``


.. _begin:

the *begin* directive
=====================

The ``begin`` statement marks the end of the prelude section of a ``bml``
document. If a prelude is given, it *must* be provided to indicate the end of
the prelude (otherwise ``bml`` will just assume there is no prelude and treat
the entire document as a body).

The ``begin`` statement has the form: ::

  begin [using someModeName]

Note that a mode name may be provided after a ``using`` keyword to start the
body immediately in a given mode.

If no initial mode is provided, the body will not begin with a mode.

.. _the-body:

the body
========

The body of a ``bml`` document is just normal text, aside from :ref:`commands <commands>` and literal blocks.


.. _literal-blocks:

literal blocks
--------------

Literal blocks tell ``bml`` that their enclosed text should not be processed by
any rules. They are notated with double square brackets: ::

  [[this text will never be processed by any rules]]


.. _commands:

commands
--------

Commands tell ``bml`` to do something during body processing. They are notated
with double curly braces.

.. _mode-changes:

mode changes
^^^^^^^^^^^^

The active mode can be changed at any time using a ``use`` command: ::

  // prelude...

  begin using oneMode

  this text will be processed using \`oneMode`

  {use aDifferentMode}

  this text will be processed using \`aDifferentMode`

This means that ::

  begin using someMode

is equivalent to ::

  begin

  {use someMode}


.. _choose-commands:

choose commands
^^^^^^^^^^^^^^^

A weighted choice may be declared inline using the same syntax for the
replacement component of :ref:`rules <rules>`: ::

  this is {{some text} 30, {an example}}

30% of the time, this will be rendered as *"this is some text"*, and 60% of the
time as *"this is an example"*.

This is interpreted exactly as if it were a one-off rule which applies at the
point of the command. The only difference is that invoked replacement functions
will be passed the ``match`` argument of ``['']``.
