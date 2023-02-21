import { render } from './renderer';
import { analyze } from './analysis';
import * as blessed from 'blessed';
import { RenderSettings } from './settings';
// Old-school require is needed for some deps to prevent weird build breakage
const fs = require('fs');
const process = require('process');
const clipboard = require('clipboardy');


export function launchInteractive(path: string, settings: RenderSettings) {
  let state: {
    refreshTimeoutId: NodeJS.Timeout | null,
    refreshIntervalSecs: number,
    scriptLastModTime: Date,
    currentRender: string,
    capturedErr: string,
  } = {
    refreshTimeoutId: null,
    refreshIntervalSecs: 10,
    scriptLastModTime: new Date(),
    currentRender: '',
    capturedErr: '',
  };

  process.stderr.write = (data: any) => {
    state.capturedErr += data;
  };

  const screen = blessed.screen({
    smartCSR: true
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
    return `Source: ${path} | Refresh delay: ${state.refreshIntervalSecs}s\n`
      + `R: Refresh | C: Copy | Ctrl-Up/Dwn: Change refresh delay`

  }

  function updateAnalysis() {
    let bmlSource = '' + fs.readFileSync(path);
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
    let statResult = fs.statSync(path);
    state.scriptLastModTime = statResult.mtime;
    let bmlSource = '' + fs.readFileSync(path);
    let result = '';
    try {
      result = render(bmlSource, settings);
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
    let statResult = fs.statSync(path);
    if (statResult.mtime.getTime() !== state.scriptLastModTime.getTime()) {
      updateAnalysis();
      interruptingRefresh();
    }
  }, 500);

  // TODO
  // - Support pausing the refresher

  // Attach key listener for force-refresh
  screen.key(['r', 'S-r'], interruptingRefresh);

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

