import { clearGlobalMocks } from '../helpers';

describe('commands / secret / docker-registry / create', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it.skip('should fail if the secret already exists', async () => {});

  it.skip('should only warn and return when the secret exists in CI mode', async () => {});

  it.skip('should load a secret from the filesystem when --from is defined', async () => {});

  it.skip('should log an error message when secret in --from does not exist', async () => {});

  it.skip('should ask the user if he wants to use a template', async () => {});

  it.skip('should not ask the user if no-interaction is flagged', async () => {});

  it.skip('should load the given secret if the user selects one', async () => {});

  it.skip('should error when no interaction mode is on and not all arguments are given', async () => {});

  it.skip('should ask the user for missing information', async () => {});

  it.skip('should create a docker registry secret with the given information', async () => {});

  it.skip('should exit if kubectl errors', async () => {});

  it.skip('should save the secret to the disk if the user accepts', async () => {});

  it.skip('should ask the user if the secret to save already exists', async () => {});
});
