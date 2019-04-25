import { vol } from 'memfs';

import { previewDeployCommand } from '../../../src/commands/preview-deploy';
import { exec } from '../../../src/utils/exec';
import { KubernetesApi } from '../../../src/utils/kubernetes-api';
import { Logger } from '../../../src/utils/logger';
import { clearGlobalMocks } from '../../helpers';

function defaultFiles(): void {
  vol.fromJSON({
    '/foo.yml': 'foo:\n  bar: yaml',
    '/bar.yml': 'bar:\n  foo: yaml',
  });
}

describe('commands / preview-deploy', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  beforeEach(() => {
    (KubernetesApi as any).create();
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it('should exit when the name is too long', async () => {
    await previewDeployCommand.handler({
      name: '1234567890123456789012345678901234567890123456789012345678901234567890',
    } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error.mock.calls[0][0]).toContain('Name of the namespace');
  });

  it('should use the default kube config when no flag is set', async () => {
    defaultFiles();
    const spy = jest.spyOn(KubernetesApi, 'fromDefault');
    await previewDeployCommand.handler({
      name: 'foobar',
      prefix: 'prev-',
      sourceFolder: '/',
    } as any);

    try {
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('should use the given kube config content when the flag is set', async () => {
    defaultFiles();
    const spy = jest.spyOn(KubernetesApi, 'fromString');
    await previewDeployCommand.handler({
      name: 'foobar',
      prefix: 'prev-',
      sourceFolder: '/',
      kubeConfig: 'yeeeehaaaw',
    } as any);

    try {
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('should create a namespace with the given name', async () => {
    defaultFiles();
    (KubernetesApi as any).instance.core.readNamespace.mockRejectedValueOnce({
      response: {
        statusCode: 404,
      },
    });

    await previewDeployCommand.handler({
      name: 'foobar',
      prefix: 'prev-',
      sourceFolder: '/',
    } as any);

    expect((KubernetesApi as any).instance.core.createNamespace.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should not create the namespace when it already exists', async () => {
    defaultFiles();
    await previewDeployCommand.handler({
      name: 'foobar',
      prefix: 'prev-',
      sourceFolder: '/',
    } as any);

    expect((KubernetesApi as any).instance.core.createNamespace).not.toHaveBeenCalled();
  });

  it('should execute kubectl with the found yamls', async () => {
    defaultFiles();

    await previewDeployCommand.handler({
      name: 'foobar',
      prefix: 'prev-',
      sourceFolder: '/',
    } as any);

    expect(exec).toHaveBeenCalled();
  });
});
