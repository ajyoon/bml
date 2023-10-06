import { render } from './renderer';
import { analyze } from './analysis';
import * as blessed from 'blessed';
import { RenderSettings } from './settings';
// Old-school require is needed for some deps to prevent weird build breakage
const fs = require('fs');
const process = require('process');
const clipboard = require('clipboardy');
const path = require('path');

type InteractiveState = {
  refreshTimeoutId: NodeJS.Timeout | null,
  refreshIntervalSecs: number,
  scriptLastModTime: Date,
  currentRender: string,
  capturedErr: string,
};

export function launchInteractive(scriptPath: string, settings: RenderSettings) {
  let state: InteractiveState = {
    refreshTimeoutId: null,
    refreshIntervalSecs: 10,
    scriptLastModTime: new Date(),
    currentRender: '',
    capturedErr: '',
  };

  const realConsoleError = console.error;
  const realConsoleWarn = console.warn;
  console.error = (data: any) => {
    state.capturedErr += data;
  };
  console.warn = console.error;
  // Ideally, these console overrides should be cleaned up afterward,
  // but the interactive view runs async so it'd have to be attached
  // to a shutdown callback of some kind.
  runInternal(scriptPath, settings, state)
}

export function runInternal(scriptPath: string, settings: RenderSettings, state: InteractiveState) {
  const documentDir = path.dirname(scriptPath);

  const screen = blessed.screen({
    smartCSR: true,
    fullUnicode: true
  });

  const infoBox = blessed.box({
    width: '100%',
    height: 'shrink',
    border: {
      type: 'line',
    },
    content: 'test',
  });

  screen.append(infoBox);

  const renderBox = blessed.box({
    top: 4,
    bottom: 3,
    border: {
      type: 'line',
    },
    content: 'output goes here',
    scrollable: true,
    scrollback: 100,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      style: {
        inverse: true,
      },
    },
    mouse: true,
    // TODO scrolling with keys doesn't seem to work.
    // I think the screen is grabbing all the keypresses
    // or something like that.
    key: true,
    vi: true,
  });

  screen.append(renderBox);

  const analysisBox = blessed.box({
    top: '100%-3',
    bottom: 0,
    border: {
      type: 'line',
    },
    content: 'analysis goes here',
  });

  screen.append(analysisBox);


  const alertPopup = blessed.message({
    left: 'center',
    top: 'center',
    width: 'shrink',
    height: 'shrink',
    border: {
      type: 'line',
    },
    hidden: true,
  });

  screen.append(alertPopup);

  function formatInfoBoxText() {
    return `Source: ${scriptPath} | Refresh delay: ${state.refreshIntervalSecs}s\n`
      + `R/Spc: Refresh | C: Copy | Ctrl-Up/Dwn: Change refresh delay`

  }

  function updateAnalysis() {
    let bmlSource = '' + fs.readFileSync(scriptPath);
    let text;
    try {
      let { possibleOutcomes } = analyze(bmlSource);
      text = `Possible outcomes: ${possibleOutcomes.toLocaleString()}`
    } catch (e) {
      text = '[error]'
    }
    analysisBox.setContent(text);
    // Don't trigger screen render, let the re-render do it
  }

  function interruptingRefresh() {
    clearTimeout(state.refreshTimeoutId!);
    refresh()
  }

  function refresh() {
    state.capturedErr = '';  // Clear stderr output
    let statResult = fs.statSync(scriptPath);
    state.scriptLastModTime = statResult.mtime;
    let bmlSource = '' + fs.readFileSync(scriptPath);
    let result = '';
    try {
      result = render(bmlSource, settings, documentDir);
    } catch (e: any) {
      // Also need to capture warnings somehow and print them out.
      // Currently when a missing ref is found it gets printed weirdly over the TUI
      result = e.stack.toString();
    }
    if (state.capturedErr) {
      result += '\n////////////////////\n\nWarning:\n' + state.capturedErr;
    }
    renderBox.setContent(result);
    infoBox.setContent(formatInfoBoxText());
    screen.render();
    state.refreshTimeoutId = setTimeout(
      refresh, state.refreshIntervalSecs * 1000);
    state.currentRender = result;
  }

  // If the file changes, trigger a refresh
  setInterval(() => {
    let statResult = fs.statSync(scriptPath);
    if (statResult.mtime.getTime() !== state.scriptLastModTime.getTime()) {
      updateAnalysis();
      interruptingRefresh();
    }
  }, 500);

  // TODO
  // - Support pausing the refresher

  // Attach key listener for force-refresh
  screen.key(['r', 'S-r', 'space'], interruptingRefresh);

  // Attach key listener for copying render output
  screen.key(['c', 'S-c'], function(ch, key) {
    clipboard.writeSync(state.currentRender);
    alertPopup.display('Copied to clipboard', 1, () => { });
  });

  // Attach key listeners for changing refresh interval
  screen.key(['C-up'], function(ch, key) {
    state.refreshIntervalSecs += 1;
    interruptingRefresh();
  });

  screen.key(['C-down'], function(ch, key) {
    state.refreshIntervalSecs -= 1;
    interruptingRefresh();
  });

  // Quit on Escape, q, or Control-C.
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    process.exit(0);
  });

  // Give render box focus so text navigation goes to it
  renderBox.enableKeys();
  renderBox.enableInput();
  renderBox.focus();

  updateAnalysis();
  refresh();
}


