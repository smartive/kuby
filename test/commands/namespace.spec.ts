import { clearGlobalMocks } from '../helpers';

describe('commands / namespace', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it.skip('should return when called with completion args', async () => {});

  it.skip('should ask the user if no name was given', async () => {});

  it.skip('should do nothing if the selected is the same as current', async () => {});

  it.skip('should fail if the namespace does not exist', async () => {});

  it.skip('should switch the namespace of the context', async () => {});
});
