building for the web
====================

.. warning::

   ``bml`` should never be run on untrusted user input. It allows the evaluation
   of arbitrary javascript, making it trivial to perform cross-site-scripting
   attacks on sites that, for example, might support ``bml`` in a user comment
   section. Don't do this!

We don't currently have hosted artifacts on a CDN. To use ``bml`` in your
website, you can use the built-in webpack build pipeline. ::

  npm run build

This will produce a compiled and polyfilled file at ``dist/bml.bundle.js`` ready
to be pulled into your site and used in most browsers we know about. ::

  <script src="/path/to/bml.bundle.js"></script>

Once loaded, ``bml`` is exposed by a single method which takes a string of
markup and returns a rendered output string. ::

  <script>
      document.getElementById("someTargetId").innerHTML =
          bml("some bml loaded as a js string");
  </script>

syntax highlighting
-------------------

.. _highlightjs: https://highlightjs.org/
.. _highlightjs stylesheet: https://github.com/isagalaev/highlight.js/tree/master/src/styles

Experimental syntax highlighting with `highlightjs`_ for the browser is
supported. To build it, run: ::

  npm run buildHighlighting

Once loaded in your site, a method ``bmlHighlighting.highlightBml()`` is exposed
which similarly takes string of markup and returns an HTML string with syntax
highlighting HTML tags. Note that you will also need to load a `highlightjs
stylesheet`_ to see the pretty colors. ::

  <head>
      <script src="/path/to/bml_highlighting.bundle.js"></script>
      <link rel="stylesheet"
            href="/path/to/a_highlightjs_style.css" />
  </head>
  <body>
      <div id="a-bml-snippet"></div>
  </body>
  <foot>
      <script>
          document.getElementById("a-bml-snippet").innerHTML =
              bml("some bml loaded as a js string");
      </script>
  </foot>

.. warning::

   This currently pulls in *all* of `highlight.js`, including a whole lot of
   languages irrelevant to bml. Pruning this to drastically reduce the bundle size
   is high on the list of upcoming improvements.
