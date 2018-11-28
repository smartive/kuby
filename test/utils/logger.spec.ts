jest.unmock('../../src/utils/logger');

const { Logger, LogLevel } = require('../../src/utils/logger');

describe('util / logger', () => {
  const original: {
    [key: string]: (message?: any, ...optionalParams: any[]) => void;
  } = {};
  const mocks: { [key: string]: jest.Mock } = {};
  let logger: any;

  beforeAll(() => {
    original['debug'] = console.debug;
    original['info'] = console.info;
    original['warn'] = console.warn;
    original['error'] = console.error;

    console.debug = mocks['debug'] = jest.fn();
    console.info = mocks['info'] = jest.fn();
    console.warn = mocks['warn'] = jest.fn();
    console.error = mocks['error'] = jest.fn();
  });

  beforeEach(() => {
    logger = new Logger();
  });

  afterEach(() => {
    mocks['debug'].mockClear();
    mocks['info'].mockClear();
    mocks['warn'].mockClear();
    mocks['error'].mockClear();
  });

  afterAll(() => {
    console.debug = original['debug'];
    console.info = original['info'];
    console.warn = original['warn'];
    console.error = original['error'];

    Logger.level = 10;
  });

  const levels = ['debug', 'info', 'warn', 'error'];
  for (const level of levels) {
    it(`should send a ${level} message`, () => {
      Logger.level = LogLevel[level as any] as any;
      (logger as any)[level]('test');

      expect(mocks[level]).toHaveBeenCalled();
    });

    it(`should not send a ${level} message when level higher`, () => {
      Logger.level = LogLevel.output;
      (logger as any)[level]('test');

      expect(mocks[level]).not.toHaveBeenCalled();
    });
  }

  it('should send an output message', () => {
    Logger.level = LogLevel.error;
    logger.output('test');
    expect(mocks['info']).toHaveBeenCalledWith('test');
  });
});
