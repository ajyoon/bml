#! /usr/bin/env node
'use strict';

let fs = require('fs');
let process = require('process');
let packageJson = require('./package.json');
let bml = require('./bml.js');


const HELP_SWITCHES = ['-h', '--h', '-help', '--help'];
const VERSION_SWITCHES = ['-v', '--version'];


function readFromStdin() {
  return fs.readFileSync(0, 'utf8'); // STDIN_FILENO = 0
}


function readFromPath(path) {
  if (!fs.existsSync(path)) {
    handleNonexistingPath(path);
    process.exit(1);
  }
  return '' + fs.readFileSync(path);
}


function handleNonexistingPath(path) {
  console.log(`Could not read from ${path}`);
  printHelp();
}


function printHelp() {
  console.log(
    `
  Usage: bml [path]

  Render a bml document read from stdin or a file, if given.
  Prints result to STDOUT.

  Options:

    ${HELP_SWITCHES}          print this help

  Source Code at ${packageJson.repository.url}
  Report Bugs at ${packageJson.bugs.url}
  Copyright (c) 2017 Andrew Yoon, under the BSD 3-Clause license
`
  );
}


function printVersionInfo() {
  process.stdout.write(packageJson.version + '\n');
}


/**
 * Parse the given command line arguments and determine the action needed.
 *
 * @param {String[]} args - command line arguments, stripped of `node`,
 *     if present, and the script name
 * @return {Object} of the form {function: Function, args: ...Any}
 */
function determineAction(args) {
  switch (args.length) {
  case 0:
    return {
      function: readFromStdin,
      args: [],
    };

  case 1:
    if (HELP_SWITCHES.indexOf(args[0]) !== -1) {
      return {
        function: printHelp,
        args: [],
      };
    } else if (VERSION_SWITCHES.indexOf(args[0]) !== -1) {
      return {
        function: printVersionInfo,
        args: [],
      };
    } else {
      return {
        function: readFromPath,
        args: [args[0]],
      };
    }

  default:
    return {
      function: printHelp,
      args: [],
    };
  }
}


function stripArgs(argv) {
  let sliceFrom = argv[0].indexOf('node') !== -1 ? 2 : 1;
  return argv.slice(sliceFrom);
}


function runBmlWithErrorCheck(bmlSource) {
  try {
    return bml(bmlSource);
  } catch (e) {
    console.error('Uh-oh! Something bad happened while rendering bml text.\n'
                  + 'If you think this is a bug, please file one at '
                  + packageJson.bugs.url + '\nError details:\n', e.stack);
    process.exit(1);
    return null; // satisfy linters...
  }
}


function main() {
  let strippedArgs = stripArgs(process.argv);
  let action = determineAction(strippedArgs);

  if (action.function === printHelp) {
    printHelp();
    process.exit(0);
  } else if (action.function === printVersionInfo) {
    printVersionInfo();
    process.exit(0);
  } else {
    let bmlSource = action.function(...action.args);
    let renderedContent = runBmlWithErrorCheck(bmlSource);
    process.stdout.write(renderedContent);
  }
}


// Execute when run as main module
if (typeof require != 'undefined' && require.main == module) {
  main();
}

// Exports for testing purposes only, not meant to be imported in other modules
exports.HELP_SWITCHES = HELP_SWITCHES;
exports.VERSION_SWITCHES = VERSION_SWITCHES;
exports.readFromStdin = readFromStdin;
exports.readFromPath = readFromPath;
exports.printHelp = printHelp;
exports.printVersionInfo = printVersionInfo;
exports.determineAction = determineAction;
exports.stripArgs = stripArgs;
