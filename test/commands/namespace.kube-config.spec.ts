import { clearGlobalMocks } from '../helpers';

describe('commands / namespace / kube-config', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it.skip('should return when called with completion args', async () => {});

  it.skip('should ask the user about the namespace if not given', async () => {});

  it.skip('should fail if the namespace does not exist', async () => {});

  it.skip('should ask the user about the service account if not given', async () => {});

  it.skip('should fail if the service account does not exist', async () => {});

  it.skip('should fail if no token secret is found', async () => {});

  it.skip('should output the kube config', async () => {});

  it.skip('TODO: should output the kube config base64 encoded', async () => {});

  it.skip('TODO: should not output the kube config in CI mode', async () => {});

  it.skip('TODO: should call the login command in CI mode', async () => {});
});
