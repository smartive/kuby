import { clearGlobalMocks } from '../helpers';

describe('commands / prepare', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it.skip('should return when called with completion args', async () => {});

  it.skip('should fail when the source folder not exists', async () => {});

  it.skip('should warn if the destination folder already exists', async () => {});

  it.skip('should ensure a clean destination folder', async () => {});

  it.skip('should get all yml / yaml files in the source folder (recursive)', async () => {});

  it.skip('should write the files that are found (with nesting replaced by "-")', async () => {});
});
