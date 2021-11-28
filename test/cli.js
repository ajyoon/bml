const expect = require('chai').expect;

const cli = require('../cli.js');
const defaultSettings = require('../src/settings.js').defaultRenderSettings;


describe('cli', function() {
  it('prints help when given any help switch', function() {
    for (let arg of cli.HELP_SWITCHES) {
      let action = cli.determineAction([arg]);
      expect(action.function).to.equal(cli.printHelp);
    }
  });

  it('prints version info when given any version switch', function() {
    for (let arg of cli.VERSION_SWITCHES) {
      let action = cli.determineAction([arg]);
      expect(action.function).to.equal(cli.printVersionInfo);
    }
  });

  it('reads from a path when given an argument', function() {
    let path = 'some path';
    action = cli.determineAction([path]);
    expect(action.function).to.equal(cli.readFromPath);
    expect(action.args).to.deep.equal([path, defaultSettings]);
  });

  it('reads from stdin when not given any arguments', function() {
    action = cli.determineAction([]);
    expect(action.function).to.equal(cli.readFromStdin);
    expect(action.args).to.deep.equal([defaultSettings]);
  });

  it('strips away only the first arg when `node` is not the first', function() {
    let stripped = cli.stripArgs(['first', 'second']);
    expect(stripped).to.deep.equal(['second']);
  });

  it('strips away the first two args when `node` is the first', function() {
    let stripped = cli.stripArgs(['/usr/bin/node', 'second', 'third']);
    expect(stripped).to.deep.equal(['third']);
  });
  
  it('fails when seed flag is used but no seed is provided', function() {
    action = cli.determineAction(['--seed']);
    expect(action.function).to.equal(cli.printHelpForError);
  });

  it('fails when seed is invalid', function() {
    let badSeeds = [
      '123.4',
      'foo',
      '--foo'
    ];
    for (let seed of badSeeds) {
      action = cli.determineAction(['--seed', seed]);
      expect(action.function).to.equal(cli.printHelpForError);
    }
  });
  
  it('supports negative seeds', function() {
      action = cli.determineAction(['--seed', '-123']);
      expect(action.function).to.equal(cli.readFromStdin);
  });
  
  it('fails on unknown flags', function() {
      action = cli.determineAction(['--foo']);
      expect(action.function).to.equal(cli.printHelpForError);
  });
  
  it('fails when more than one path is provided', function() {
    action = cli.determineAction(['1.bml', '2.bml']);
    expect(action.function).to.equal(cli.printHelpForError);
  });
  
  it('supports all settings', function() {
    let path = 'foo.bml';
    action = cli.determineAction([
      '--seed', '123', '--no-eval', '--render-markdown',
      '--no-whitespace-cleanup', path]);
    let expectedSettings = {
      randomSeed: 123,
      allowEval: false,
      renderMarkdown: true,
      whitespaceCleanup: false
    };
    expect(action.function).to.equal(cli.readFromPath);
    expect(action.args).to.deep.equal([path, expectedSettings]);
  });
});
