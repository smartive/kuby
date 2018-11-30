import { clearGlobalMocks } from '../helpers';

describe('commands / namespace / utils / kubens', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  describe('getCurrentNamespace()', () => {
    it.skip('should get the current contexts namespace', async () => {});
  });

  describe('getNamespaces()', () => {
    it.skip('should get all namespaces', async () => {});

    it.skip('should filter empty values', async () => {});

    it.skip('should sort the list', async () => {});
  });

  describe('getServiceAccountsForNamespace()', () => {
    it.skip('should get the service accounts of a namespace', async () => {});

    it.skip('should filter empty values', async () => {});

    it.skip('should sort the list', async () => {});
  });
});
