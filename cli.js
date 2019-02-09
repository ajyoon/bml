#! /usr/bin/env node
'use strict';

let fs = require('fs');
let process = require('process');
let packageJson = require('./package.json');
let bml = require('./bml.js');


const HELP_SWITCHES = ['-h', '--h', '-help', '--help'];
const VERSION_SWITCHES = ['-v', '--version'];
const SEED_SWITCHES = ['--seed']


function readFromStdin(seed) {
  let settings = seed ? { randomSeed: seed } : {};
  return {
    bmlSource: fs.readFileSync(0, 'utf8'), // STDIN_FILENO = 0
    settings
  };
}


function readFromPath(path, seed) {
  if (!fs.existsSync(path)) {
    handleNonexistingPath(path);
    process.exit(1);
  }
  let settings = seed ? { randomSeed: seed } : {};
  return {
    bmlSource: '' + fs.readFileSync(path),
    settings
  }
}


function handleNonexistingPath(path) {
  console.log(`Could not read from ${path}`);
  printHelp();
}


function printHelp() {
  console.log(
    `
  Usage: bml [options] [path]

  Render a bml document read from stdin or a file, if given.
  Prints result to STDOUT.

  Options:

    Options which, if present, should be the only options given:

    ${HELP_SWITCHES}    print this help and quit
    ${VERSION_SWITCHES}           print the bml version number and quiet

    Other options:

    ${SEED_SWITCHES} VALUE           set the random seed for the bml render

  Source Code at https://github.com/ajyoon/bml
  Report Bugs at https://github.com/ajyoon/bml/issues
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
  let defaultAction = {
    function: printHelp,
    args: [],
  };

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
  case 2:
    // Only really handle the case where a seed is given and bml
    // is taken from stdin
    if (SEED_SWITCHES.indexOf(args[0]) !== -1) {
      return {
        function: readFromStdin,
        args: [args[1]]
      }
    }
    return defaultAction;
  case 3:
    // Only really handle the case where a seed and path are given
    // e.g. `bml --seed 1234 ./someFile.bml`
    if (SEED_SWITCHES.indexOf(args[0]) !== -1) {
      return {
        function: readFromPath,
        args: [args[2], args[1]]
      }
    }
    return defaultAction;
  default:
    return defaultAction;
  }
}


function stripArgs(argv) {
  let sliceFrom = argv[0].indexOf('node') !== -1 ? 2 : 1;
  return argv.slice(sliceFrom);
}


function runBmlWithErrorCheck(bmlSource, settings) {
  try {
    return bml(bmlSource, settings);
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
    let { bmlSource, settings } = action.function(...action.args);
    let renderedContent = runBmlWithErrorCheck(bmlSource, settings);
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
