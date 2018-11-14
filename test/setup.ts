import '../src/utils/spawn';

import { Logger } from '../src/utils/logger';

Logger.level = 10;

jest.mock('fs');
jest.mock('../src/utils/spawn', () => ({
  spawn: jest.fn(() => 0),
}));
