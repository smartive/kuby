import { clearGlobalMocks } from '../helpers';

describe('commands / namespace / kube-config', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it.skip('should ', async () => {});
});
