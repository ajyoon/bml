====================
building for the web
====================

.. warning::

   ``bml`` should never be run on untrusted user input. It allows the evaluation
   of arbitrary javascript, making it trivial to perform cross-site-scripting
   attacks on sites that, for example, might support ``bml`` in a user comment
   section. Don't do this!

We don't currently have hosted artifacts on a CDN. To use ``bml`` in your
website, you can use the built-in webpack build pipeline.

.. code:: bash

  npm run build

This will produce a compiled and polyfilled file at ``dist/bml.bundle.js`` ready
to be pulled into your site and used in most browsers we know about.

.. code:: html

  <script src="/path/to/bml.bundle.js"></script>

Once loaded, ``bml`` is exposed by a single method which takes a string of
markup and returns a rendered output string.

.. code:: html

  <script>
      document.getElementById("someTargetId").innerHTML =
          bml("some bml loaded as a js string");
  </script>

syntax highlighting
===================


.. _PrismJS: https://prismjs.com/
.. _PrismJS stylesheet: https://github.com/PrismJS/prism/tree/master/themes

Experimental syntax highlighting with `prismjs`_ for the browser is
supported. To build it, run:

.. code:: bash

  npm run buildHighlighting

Once loaded in your site, a method ``bmlHighlighting.highlightBml()`` is exposed
which similarly takes string of markup and returns an HTML string with syntax
highlighting HTML tags. Note that you will also need to load a `PrismJS stylesheet`_ to see the pretty colors.
