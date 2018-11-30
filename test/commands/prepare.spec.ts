import { clearGlobalMocks } from '../helpers';

describe('commands / prepare', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it.skip('should ', async () => {});
});
