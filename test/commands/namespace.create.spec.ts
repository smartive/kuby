import { clearGlobalMocks } from '../helpers';

describe('commands / namespace / create', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it.skip('should fail if the given name already exists', async () => {});

  it.skip('should load the default role file if one exists', async () => {});

  it.skip('should use the default role if no file exists', async () => {});

  it.skip('should ask the user for certain information', async () => {});

  it.skip('should use biased information when using no-interaction mode', async () => {});

  it.skip('should write the default role file when user selects to save the role', async () => {});

  it.skip('should abort if the user does not want to create the namespace', async () => {});

  it.skip('should not ask the user to proceed if in no-interaction mode', async () => {});

  it.skip('should create the namespace', async () => {});

  it.skip('should fail if "create ns" failes', async () => {});

  it.skip('should fail if no role name is provided', async () => {});

  it.skip('should execute the creation of rolebindings and service accounts', async () => {});

  it.skip('should call namespace kubeconfig command to output the kubeconfig', async () => {});

  it.skip('TODO: should call namespace kubeconfig command with --ci mode', async () => {});
});
