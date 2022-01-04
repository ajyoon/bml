import expect from 'expect';
import * as cli from '../src/cli';
import { defaultRenderSettings } from '../src/settings';


describe('cli', function() {

  beforeAll(() => {
    // Many of these tests trigger console errors which spam the Jest
    // test results because for some reason Jest doesn't support
    // silencing logs on passing tests...
    console.error = jest.fn();
  });

  it('prints help when given any help switch', function() {
    for (let arg of cli.HELP_SWITCHES) {
      let action = cli.determineAction([arg]);
      expect(action.function).toBe(cli.printHelp);
    }
  });

  it('prints version info when given any version switch', function() {
    for (let arg of cli.VERSION_SWITCHES) {
      let action = cli.determineAction([arg]);
      expect(action.function).toBe(cli.printVersionInfo);
    }
  });

  it('reads from a path when given an argument', function() {
    let path = 'some path';
    let action = cli.determineAction([path]);
    expect(action.function).toBe(cli.readFromPath);
    expect(action.args).toEqual([path, defaultRenderSettings]);
  });

  it('reads from stdin when not given any arguments', function() {
    let action = cli.determineAction([]);
    expect(action.function).toBe(cli.readFromStdin);
    expect(action.args).toEqual([defaultRenderSettings]);
  });

  it('strips away only the first arg when `node` is not the first', function() {
    let stripped = cli.stripArgs(['first', 'second']);
    expect(stripped).toEqual(['second']);
  });

  it('strips away the first two args when `node` is the first', function() {
    let stripped = cli.stripArgs(['/usr/bin/node', 'second', 'third']);
    expect(stripped).toEqual(['third']);
  });

  it('fails when seed flag is used but no seed is provided', function() {
    let action = cli.determineAction(['--seed']);
    expect(action.function).toBe(cli.printHelpForError);
  });

  it('fails when seed is invalid', function() {
    let badSeeds = [
      '123.4',
      'foo',
      '--foo'
    ];
    for (let seed of badSeeds) {
      let action = cli.determineAction(['--seed', seed]);
      expect(action.function).toBe(cli.printHelpForError);
    }
  });

  it('supports negative seeds', function() {
    let action = cli.determineAction(['--seed', '-123']);
    expect(action.function).toBe(cli.readFromStdin);
  });

  it('fails on unknown flags', function() {
    let action = cli.determineAction(['--foo']);
    expect(action.function).toBe(cli.printHelpForError);
  });

  it('fails when more than one path is provided', function() {
    let action = cli.determineAction(['1.bml', '2.bml']);
    expect(action.function).toBe(cli.printHelpForError);
  });

  it('supports all settings', function() {
    let path = 'foo.bml';
    let action = cli.determineAction([
      '--seed', '123', '--no-eval', path]);
    let expectedSettings = {
      randomSeed: 123,
      allowEval: false,
    };
    expect(action.function).toBe(cli.readFromPath);
    expect(action.args).toEqual([path, expectedSettings]);
  });
});
