#! /usr/bin/env node
'use strict';

const fs = require('fs');
const process = require('process');
const packageJson = require('../package.json');
const bml = require('./bml.ts');

const SEED_RE = /^-?\d+$/;

const HELP_SWITCHES = ['-h', '--h', '-help', '--help'];
const VERSION_SWITCHES = ['-v', '--version'];
const SEED_SWITCHES = ['--seed'];
const NO_EVAL_SWITCHES = ['--no-eval'];
const RENDER_MARKDOWN_SWITCHES = ['--render-markdown'];
const NO_WHITESPACE_CLEANUP_SWITCHES = ['--no-whitespace-cleanup'];

const ALL_SWITCHES = [].concat(
  HELP_SWITCHES, VERSION_SWITCHES,
  SEED_SWITCHES, NO_EVAL_SWITCHES,
  RENDER_MARKDOWN_SWITCHES, NO_WHITESPACE_CLEANUP_SWITCHES);


function readFromStdin(settings) {
  return {
    bmlSource: fs.readFileSync(0, 'utf8'), // STDIN_FILENO = 0
    settings
  };
}


function readFromPath(path, settings) {
  if (!fs.existsSync(path)) {
    handleNonexistingPath(path);
    process.exit(1);
  }
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

    ${HELP_SWITCHES}        print this help and quit
    ${VERSION_SWITCHES}               print the BML version number and quiet

    Other options:

    ${SEED_SWITCHES} INTEGER             set the random seed for the bml render
    ${NO_EVAL_SWITCHES}                  disable Javascript evaluation
    ${RENDER_MARKDOWN_SWITCHES}          render the document as markdown to HTML
    ${NO_WHITESPACE_CLEANUP_SWITCHES}    disable whitespace cleanup

  Source Code at https://github.com/ajyoon/bml
  Report Bugs at https://github.com/ajyoon/bml/issues
  Copyright (c) 2017 Andrew Yoon, under the BSD 3-Clause license
`
  );
}

// The way this function is just a passthrough really illustrates
// why the higher-level-function approach of this module is awkward
function printHelpForError() {
  printHelp();
}


function printVersionInfo() {
  process.stdout.write(packageJson.version + '\n');
}

function argsContainAnyUnknownSwitches(args) {
  let unknown_arg = args.find(
    (arg) => !SEED_RE.test(arg) && arg.startsWith('-') && !ALL_SWITCHES.includes(arg));
  if (unknown_arg) {
    console.error(`Unknown argument ${unknown_arg}`);
    return true;
  }
  return false;
}

/**
 * Parse the given command line arguments and determine the action needed.
 *
 * @param {String[]} args - command line arguments, stripped of `node`,
 *     if present, and the script name
 * @return {Object} of the form {function: Function, args: ...Any}
 */
function determineAction(args) {
  let errorAction = {
    function: printHelpForError,
    args: []
  };
  
  if (argsContainAnyUnknownSwitches(args)) {
    return errorAction;
  }

  let expectSeed = false;
  
  let file = null;
  let noEval = false;
  let renderMarkdown = false;
  let noWhitespaceCleanup = false;
  let seed = null;
  
  for (let arg of args) {
    if (expectSeed) {
      if (SEED_RE.test(arg)) {
        seed = Number(arg);
        expectSeed = false;
      } else {
        console.error('Invalid seed: ' + arg);
        return errorAction;
      }
    } else if (HELP_SWITCHES.includes(arg)) {
      return {
        function: printHelp,
        args: []
      };
    } else if (VERSION_SWITCHES.includes(arg)) {
      return {
        function: printVersionInfo,
        args: [],
      };
    } else if (NO_EVAL_SWITCHES.includes(arg)) {
      noEval = true;
    } else if (RENDER_MARKDOWN_SWITCHES.includes(arg)) {
      renderMarkdown = true;
    } else if (NO_WHITESPACE_CLEANUP_SWITCHES.includes(arg)) {
      noWhitespaceCleanup = true;
    } else if (SEED_SWITCHES.includes(arg)) {
      expectSeed = true;
    } else {
      if (file !== null) {
        console.error('More than one path provided.');
        return errorAction;
      }
      file = arg;
    }
  }
  
  if (expectSeed) {
    console.error('No seed provided.')
    return errorAction;
  }

  let settings = {
    randomSeed: seed,
    allowEval: !noEval,
    renderMarkdown: renderMarkdown,
    whitespaceCleanup: !noWhitespaceCleanup
  };
  
  if (file === null) {
    return {
      function: readFromStdin,
      args: [settings]
    }
  } else {
    return {
      function: readFromPath,
      args: [file, settings]
    }
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

  if (action.function === printHelp || action.function === printVersionInfo) {
    action.function();
    process.exit(0);
  } else if (action.function == printHelpForError) {
    action.function();
    process.exit(1);
  } else {
    let { bmlSource, settings } = action.function(...action.args);
    let renderedContent = runBmlWithErrorCheck(bmlSource, settings);
    process.stdout.write(renderedContent);
  }
}

// Execute when run as main module
if (!module.parent) {
  main();
}

// Exports for testing purposes only, not meant to be imported in other modules
exports.HELP_SWITCHES = HELP_SWITCHES;
exports.VERSION_SWITCHES = VERSION_SWITCHES;
exports.readFromStdin = readFromStdin;
exports.readFromPath = readFromPath;
exports.printHelp = printHelp;
exports.printHelpForError = printHelpForError;
exports.printVersionInfo = printVersionInfo;
exports.determineAction = determineAction;
exports.stripArgs = stripArgs;