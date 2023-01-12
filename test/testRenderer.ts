import expect from 'expect';
import fs from 'fs';
import path from 'path'
import * as rand from '../src/rand';

import {
  JavascriptSyntaxError,
  BMLSyntaxError,
  BMLDuplicatedRefIndexError,
} from '../src/errors';

import { render } from '../src/renderer';


describe('render', function() {

  beforeEach(function() {
    rand.setRandomSeed(0); // pin seed for reproducibility
  });

  it('executes simple forks', function() {
    let testString = 'foo {(bar), (biz)}';
    expect(render(testString)).toEqual('foo bar');
  });

  it('executes forks with eval blocks', function() {
    let testString = 'foo {[insert("eval")], (biz)}';
    expect(render(testString)).toEqual('foo eval');
  });

  it('executes forks with weights', function() {
    let testString = 'foo {[insert("eval")], (biz) 99}';
    expect(render(testString)).toEqual('foo biz');
  });

  it('executes nested forks', function() {
    let testString = 'foo {(bar {(nested branch), (other nested branch)}), (biz)}';
    expect(render(testString)).toEqual('foo bar nested branch');
  });

  it('supports bare references', function() {
    let testString = 'foo {id: (bar), (biz)} {@id}';
    expect(render(testString)).toEqual('foo bar bar');
  });

  it('supports silent fork references', function() {
    let testString = 'foo {#id: (bar), (biz)} {@id}';
    expect(render(testString)).toEqual('foo  bar');
  });

  it('supports mapped references', function() {
    let testString = 'foo {id: (bar), (biz)} {@id: 0 -> (buzz), (bazz)}';
    expect(render(testString)).toEqual('foo bar buzz');
  });

  it('skips line break after silent fork on its own line', function() {
    let testString = 'foo\n{#id: (bar)}\nbiz';
    expect(render(testString)).toEqual('foo\nbiz');
  });
});
