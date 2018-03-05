.. _marked-settings-doc: https://github.com/markedjs/marked/blob/master/USING_ADVANCED.md#options


the blur markup language
========================

The blur markup language (``bml``) is a hybrid language combining javascript,
``bml`` constructs, and whatever target format you use. Markdown and HTML are
supported out of the box.


.. _document-structure:

document structure
------------------

A ``bml`` document consists of two sections: an optional
:ref:`prelude<the-prelude>` and a body. If a prelude is given, it must always
end with a :ref:`begin` statement. If no :ref:`begin` statement is found, the
document is interpreted as having only a :ref:`body <the-body>`::

  [prelude]

  begin [using someMode]

  [body]


.. _the-prelude:

the prelude
-----------

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
      'x' as 'y'
  }

  begin using someMode


.. _eval:

eval
^^^^

The ``eval`` block allows you to evaluate arbitrary javascript prior to
interpreting the document body. This is primarily useful for two purposes:

* overriding default ``bml`` settings
* defining :ref:`replacement functions <replacement-functions>`

The entire

.. _bml-settings:

bml settings
"""

The ``settings`` object is a javascript object of setting overrides that may be
declared in the :ref:`eval` block::

  eval {
      settings = {
          renderMarkdown: true
      };
  }

If it is created during prelude evaluation, all provided settings will override
their defaults.



+--------------------+---------+-----------------------------------------------+
|setting             |default  |purpose                                        |
+--------------------+---------+-----------------------------------------------+
|``renderMarkdown``  |``false``|Whether or not the rendered ``bml`` document   |
|                    |         |should be post-processed as markdown. If       |
|                    |         |``true``, the output will be processed as      |
|                    |         |markdown and output as HTML.                   |
+--------------------+---------+-----------------------------------------------+
|``markdownSettings``|``{}``   |A settings object to be passed to ``marked``,  |
|                    |         |the markdown processor built in to ``bml``. For|
|                    |         |details on what settings can be passed to this,|
|                    |         |see `marked-settings-doc`_                     |
+--------------------+---------+-----------------------------------------------+
|``version``         |``null`` |The ``bml`` version number the document is     |
|                    |         |written for. If present, ``bml`` will check    |
|                    |         |that this matches the version running. If it   |
|                    |         |does not, a warning will be logged to the      |
|                    |         |console. If this is emitted, a warning will be |
|                    |         |logged to the console that this is recommended.|
+--------------------+---------+-----------------------------------------------+


.. _replacement-functions:

replacement functions
"""

Replacement functions allow you to perform nontrivial substitutions in your document. They may be used by modes in :ref:`replacers` and in :ref:`inline blurs <inline-blurs>`.

.. _mode:

mode
^^^^

blah blah blah
blah blah blah
blah blah blah

.. _replacers:

replacers
"""""""""


.. _begin:

begin
^^^^^

blah blah blah
blah blah blah
blah blah blah



.. _the-body:

the body
--------

body body body

.. _inline-blurs:

inline blurs
^^^^^^^^^^^^
