import { clearGlobalMocks } from '../helpers';

describe('commands / namespace / create', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it.skip('should ', async () => {});
});
