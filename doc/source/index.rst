========================
the blur markup language
========================

``bml`` is a stochastic markup language that lets you write chance-determined
text with ease.

`Try it online! <https://sandbox.bml-lang.org>`_

And check out `the VS Code extension
<https://marketplace.visualstudio.com/items?itemName=bml-lang.bml-vscode>`_
for syntax highlighting and built-in runner support!

getting started
===============

``bml`` can be installed and pulled into your projects using ``npm``. Installing
is as simple as: ::

  npm install bml

Once installed, you can use ``bml`` locally in node scripts using the primary
package entrypoint function exported by the package.

.. code:: javascript

  const bml = require('bml');
  const aBmlScript = 'some bml markup';
  const bmlOutput = bml(aBmlScript);
  console.log(bmlOutput);

This function renders a given string of ``bml`` markup and returns its output.

``bml`` is `Free Software <https://www.gnu.org/philosophy/free-sw.html>`_ under
the `BSD 3-Clause license <https://github.com/ajyoon/bml/blob/master/LICENSE>`_.
All source code is available at `<https://github.com/ajyoon/bml>`_.

.. warning::

   By default, ``bml`` supports the :ref:`evaluation of arbitrary
   Javascript <eval>`. Before running ``bml`` on untrusted input, please
   consider :ref:`disabling this feature <render-settings>`.

.. toctree::
   :caption: Contents:

   language/overview
   building_for_the_web
   the_command_line_interface
   api_reference
