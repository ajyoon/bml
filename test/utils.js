export function spyConsole() {
  let spy = {};

  beforeEach(() => {
    spy.consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
    spy.consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    spy.consoleError.mockClear();
  });

  afterAll(() => {
    spy.consoleError.mockRestore();
  });

  return spy;
}

