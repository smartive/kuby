import 'clipboardy';
import 'inquirer';

import '../src/utils/exec';
import '../src/utils/extensions';
import '../src/utils/logger';
import '../src/utils/spawn';

jest.mock('fs');
jest.mock('../src/utils/spawn', () => ({
  spawn: jest.fn(() => 0),
}));
jest.mock('../src/utils/exec', () => ({
  exec: jest.fn(),
}));
jest.mock('../src/utils/logger', () => ({
  Logger: class FakeLogger {
    public static instance: FakeLogger;

    public debug: jest.Mock = jest.fn();
    public info: jest.Mock = jest.fn();
    public output: jest.Mock = jest.fn();
    public success: jest.Mock = jest.fn();
    public warn: jest.Mock = jest.fn();
    public error: jest.Mock = jest.fn();

    constructor() {
      FakeLogger.instance = this;
    }

    public reset(): void {
      this.debug.mockClear();
      this.info.mockClear();
      this.output.mockClear();
      this.success.mockClear();
      this.warn.mockClear();
      this.error.mockClear();
    }
  },
}));
jest.mock('clipboardy', () => ({
  write: jest.fn(),
}));
jest.mock('inquirer', () => ({
  registerPrompt: jest.fn(),
  prompt: jest.fn(),
}));
