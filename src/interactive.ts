import { render } from './renderer';
import * as blessed from 'blessed';
import { RenderSettings } from './settings';
// Old-school require is needed to prevent weird build breakage
const fs = require('fs');


export function launchInteractive(path: string, settings: RenderSettings) {
  const screen = blessed.screen({
    smartCSR: true
  });

  screen.title = 'BML Interactive Runner';

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

  let state: {
    refreshTimeoutId: NodeJS.Timeout | null,
    refreshIntervalSecs: number,
    scriptLastModTime: Date,
  } = {
    refreshTimeoutId: null,
    refreshIntervalSecs: 10,
    scriptLastModTime: new Date()
  }

  function formatInfoBoxText() {
    return `Source: ${path} | Refresh delay: ${state.refreshIntervalSecs}s\n`
      + `R: Refresh | Ctrl-Up/Dwn: Change refresh delay`

  }

  function interruptingRefresh() {
    clearTimeout(state.refreshTimeoutId!);
    refresh()
  }

  function refresh() {
    let statResult = fs.statSync(path);
    state.scriptLastModTime = statResult.mtime;
    let bmlSource = '' + fs.readFileSync(path);
    let result = render(bmlSource, settings);
    renderBox.setContent(result);
    infoBox.setContent(formatInfoBoxText());
    screen.render();
    state.refreshTimeoutId = setTimeout(
      refresh, state.refreshIntervalSecs * 1000);
  }

  // If the file changes, trigger a refresh
  setInterval(() => {
    let statResult = fs.statSync(path);
    if (statResult.mtime.getTime() !== state.scriptLastModTime.getTime()) {
      interruptingRefresh();
    }
  }, 500);

  // Attach key listener for force-refresh
  screen.key(['r', 'R'], interruptingRefresh);

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

  refresh();
}

