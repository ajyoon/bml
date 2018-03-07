the blur markup language
========================

``bml`` is a stochastic markup language that lets you write chance-determined
text with ease.

getting started
---------------

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

.. toctree::
   :caption: Contents:

   language/overview
   building_for_the_web
   the_command_line_interface
