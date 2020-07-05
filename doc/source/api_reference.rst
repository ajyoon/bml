.. _api-reference:

=============
api reference
=============

The bml library is exposed by a single function:

.. code:: javascript

   bml(sourceString, renderSettings, defaultDocumentSettings)

where ``sourceString`` is a single string holding the contents of a complete bml
document, and ``renderSettings`` is an optional ``Object`` with the following
properties:

+---------------+------------------------------------------------+
|setting        |purpose                                         |
+---------------+------------------------------------------------+
|``randomSeed`` |a random seed for the render session. may be    |
|               |any ``Object``. All bml documents rendered on   |
|               |the same ``bml`` version with the same random   |
|               |seed should result in the same output, assuming |
|               |the bml document's ``eval`` block is            |
|               |deterministic or uses the provided ``rand``     |
|               |module functions for random components          |
+---------------+------------------------------------------------+
|``allowEval``  |A boolean flag controlling whether ``eval``     |
|               |blocks should be executed in this render. This  |
|               |is primarily useful for security purposes and   |
|               |defaults to ``true``.                           |
|               |                                                |
|               |                                                |
|               |                                                |
+---------------+------------------------------------------------+

``defaultDocumentSettings`` is an optional ``Object`` containing
:ref:`document settings <bml-settings>` overriding the global defaults
*before* settings from the document are applied. When provided, the
setting resolution order is:

1. Global :ref:`document settings <bml-settings>`
2. ``defaultDocumentSettings`` from render call here
3. Settings defined in document's ``eval`` block.

.. _provided-eval-api:

provided eval api
=================

Some functions are automatically made available to :ref:`eval blocks <eval>`. Of
particular note are those functions in the ``rand`` module, which allow random
values to be made which conform to the optional random seed provided to bml.

.. warning::

   These functions are NOT part of the public API of bml. They can only be
   accessed in the ``eval`` block of bml scripts.

-----------------

.. code:: javascript

   rand.randomFloat(min, max)

Return a random float within the given bounds

-----------------

.. code:: javascript

   rand.randomInt(min, max)

Return a random integer within the given bounds
