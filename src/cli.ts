#!/usr/bin/env node
import fs from 'fs';
import process from 'process';
import { RenderSettings } from './settings';
import { analyze } from './analysis';
import { launchInteractive } from './interactive';

const packageJson = require('../package.json');
// Seems this needs to use `require` to bundle correctly. No idea why.
const bml = require('./bml.ts');

const SEED_RE = /^-?\d+$/;

export const HELP_SWITCHES = ['-h', '--h', '-help', '--help'];
export const VERSION_SWITCHES = ['-v', '--version'];
export const SEED_SWITCHES = ['--seed'];
export const NO_EVAL_SWITCHES = ['--no-eval'];
export const ANALYZE_SWITCHES = ['--analyze'];
export const INTERACTIVE_SWITCHES = ['-i', '--interactive'];
export const ALL_SWITCHES = ([] as string[]).concat(
  HELP_SWITCHES, VERSION_SWITCHES,
  SEED_SWITCHES, NO_EVAL_SWITCHES,
  ANALYZE_SWITCHES, INTERACTIVE_SWITCHES);

export type BMLArgs = { bmlSource: string, settings: RenderSettings };
export type Action = { function: Function, args: any[] };

function readFile(path: string) {
  if (!fs.existsSync(path)) {
    handleNonexistingPath(path);
    process.exit(1);
  }
  return '' + fs.readFileSync(path);
}

export function executeFromStdin(settings: RenderSettings): BMLArgs {
  return {
    bmlSource: fs.readFileSync(0, 'utf8'), // STDIN_FILENO = 0
    settings
  };
}

export function executeFromPath(path: string, settings: RenderSettings): BMLArgs {
  return {
    bmlSource: readFile(path),
    settings
  }
}

export function analyzeFromStdin(): string {
  return fs.readFileSync(0, 'utf8'); // STDIN_FILENO = 0
}

export function analyzeFromPath(path: string): string {
  return readFile(path);
}

export function handleNonexistingPath(path: string) {
  console.log(`Could not read from ${path}`);
  printHelp();
}


export function printHelp() {
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
    ${ANALYZE_SWITCHES}                  analyze the document instead of executing
    ${INTERACTIVE_SWITCHES}              run BML interactively

  Source Code at https://github.com/ajyoon/bml
  Report Bugs at https://github.com/ajyoon/bml/issues
  Copyright (c) 2017 Andrew Yoon, under the BSD 3-Clause license
`
  );
}

// The way this function is just a passthrough really illustrates
// why the higher-level-function approach of this module is awkward
export function printHelpForError() {
  printHelp();
}

export function printVersionInfo() {
  process.stdout.write(packageJson.version + '\n');
}

export function argsContainAnyUnknownSwitches(args: string[]): boolean {
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
export function determineAction(args: string[]): Action {
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
  let seed = null;
  let analyze = false;
  let interactive = false;

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
    } else if (SEED_SWITCHES.includes(arg)) {
      expectSeed = true;
    } else if (ANALYZE_SWITCHES.includes(arg)) {
      analyze = true;
    } else if (INTERACTIVE_SWITCHES.includes(arg)) {
      interactive = true;
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
  };

  if (interactive) {
    if (file === null) {
      console.error('Interactive mode requires a file name')
      return errorAction;
    }
    return {
      function: executeInteractively,
      args: [file, settings]
    };
  }

  if (file === null) {
    if (analyze) {
      return {
        function: analyzeFromStdin,
        args: []
      }
    } else {
      return {
        function: executeFromStdin,
        args: [settings]
      }
    }
  } else {
    if (analyze) {
      return {
        function: analyzeFromPath,
        args: [file]
      }
    } else {
      return {
        function: executeFromPath,
        args: [file, settings]
      }
    }
  }
}


export function stripArgs(argv: string[]): string[] {
  let sliceFrom = argv[0].indexOf('node') !== -1 ? 2 : 1;
  return argv.slice(sliceFrom);
}


export function runBmlWithErrorCheck(bmlSource: string, settings: RenderSettings): string {
  try {
    return bml(bmlSource, settings);
  } catch (e: any) {
    console.error('Uh-oh! Something bad happened while rendering bml text.\n'
      + 'If you think this is a bug, please file one at '
      + packageJson.bugs.url + '\nError details:\n', e.stack);
    process.exit(1);
  }
}


export function executeInteractively(path: string, settings: RenderSettings) {
  launchInteractive(path, settings);
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
  } else if (action.function == executeInteractively) {
    action.function(...action.args);
  } else if (action.function == analyzeFromPath || action.function == analyzeFromStdin) {
    let bmlSource = action.function(...action.args);
    let analysisResult = analyze(bmlSource);
    let formattedCount = analysisResult.possibleOutcomes.toLocaleString();
    process.stdout.write(`Total possible branches: ${formattedCount}\n`);
    process.exit(0);
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
