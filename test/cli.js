let assert = require('assert');

let cli = require('../cli.js');


describe('cli', function() {
  it('wants to print help when given any help switch', function() {
    for (let arg of cli.HELP_SWITCHES) {
      let action = cli.determineAction([arg]);
      assert.strictEqual(action.function, cli.printHelp);
      assert.deepEqual(action.args, []);
    }
  });

  it('wants to print version info when given any version switch', function() {
    for (let arg of cli.VERSION_SWITCHES) {
      let action = cli.determineAction([arg]);
      assert.strictEqual(action.function, cli.printVersionInfo);
      assert.deepEqual(action.args, []);
    }
  });

  it('wants to read from a path when given an argument', function() {
    let path = 'some path';
    action = cli.determineAction([path]);
    assert.strictEqual(action.function, cli.readFromPath);
    assert.deepEqual(action.args, [path]);
  });

  it('wants to read from stdin when not given any arguments', function() {
    action = cli.determineAction([]);
    assert.strictEqual(action.function, cli.readFromStdin);
    assert.deepEqual(action.args, []);
  });

  it('strips away only the first arg when `node` is not the first', function() {
    let stripped = cli.stripArgs(['first', 'second']);
    assert.deepEqual(stripped, ['second']);
  });

  it('strips away the first two args when `node` is the first', function() {
    let stripped = cli.stripArgs(['/usr/bin/node', 'second', 'third']);
    assert.deepEqual(stripped, ['third']);
  });
});
