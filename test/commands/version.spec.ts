import { clearGlobalMocks } from '../helpers';

describe('commands / version', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it.skip('should log the tools version', async () => {});

  it.skip('should log the kubectl version', async () => {});

  it.skip('should log the remote version', async () => {});

  describe('getVersionInfo()', () => {
    it.skip('should exec kubectl version', async () => {});

    it.skip('should exec kubectl without --client when remote version is asked', async () => {});

    it.skip('should return the correct version', async () => {});
  });
});
