import { prompt } from 'inquirer';
import { EOL } from 'os';
import * as Kubectx from '../../../src/commands/context/utils/kubectx';
import { namespaceKubeConfigCommand } from '../../../src/commands/namespace/kube-config';
import * as Kubens from '../../../src/commands/namespace/utils/kubens';
import { exec } from '../../../src/utils/exec';
import { Logger } from '../../../src/utils/logger';
import { clearGlobalMocks } from '../../helpers';

describe('commands / namespace / kube-config', () => {
  let currentNamespace: jest.SpyInstance;
  let namespaces: jest.SpyInstance;
  let serviceAccountsForNamespace: jest.SpyInstance;
  let currentContext: jest.SpyInstance;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    currentNamespace = jest.spyOn(Kubens, 'getCurrentNamespace').mockResolvedValue('currentNs');
    namespaces = jest.spyOn(Kubens, 'getNamespaces').mockResolvedValue(['ns1', 'ns2']);
    serviceAccountsForNamespace = jest.spyOn(Kubens, 'getServiceAccountsForNamespace').mockResolvedValue(['sa1', 'sa2']);
    currentContext = jest.spyOn(Kubectx, 'getCurrentContext').mockResolvedValue('currentCtx');
  });

  afterEach(() => {
    clearGlobalMocks();
    currentNamespace.mockClear();
    namespaces.mockClear();
    serviceAccountsForNamespace.mockClear();
    currentContext.mockClear();
  });

  afterAll(() => {
    currentNamespace.mockRestore();
    namespaces.mockRestore();
    serviceAccountsForNamespace.mockRestore();
    currentContext.mockRestore();
  });

  it('should return when called with completion args', async () => {
    await namespaceKubeConfigCommand.handler({
      getYargsCompletions: true,
    } as any);
    expect((Logger as any).instance).toBeUndefined();
  });

  it('should ask the user about the namespace if not given', async () => {
    await namespaceKubeConfigCommand.handler({} as any);
    expect(prompt).toHaveBeenCalled();
  });

  it('should fail if the namespace does not exist', async () => {
    await namespaceKubeConfigCommand.handler({ namespace: 'foobar' } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith('The namespace "foobar" does not exist.');
  });

  it('should ask the user about the service account if not given', async () => {
    await namespaceKubeConfigCommand.handler({ namespace: 'ns2' } as any);
    expect(prompt).toHaveBeenCalled();
  });

  it('should fail if the service account does not exist', async () => {
    await namespaceKubeConfigCommand.handler({
      namespace: 'ns1',
      serviceAccount: 'foobar',
    } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith(
      'The service account "foobar" does not exist in namespace "ns1".',
    );
  });

  it('should fail if no token secret is found', async () => {
    (exec as jest.Mock).mockResolvedValue('sa1;nope');
    await namespaceKubeConfigCommand.handler({
      namespace: 'ns1',
      serviceAccount: 'sa1',
    } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith(
      'Error while fetching the config: Error: No token secret found',
    );
  });

  it('should output the kube config', async () => {
    const result = `

apiVersion: v1
kind: Config
clusters:
- cluster:
    server: address
    certificate-authority-data: certificate
  name: cluster
users:
- name: sa1
  user:
    token: foobar
preferences: {}
contexts:
- context:
    cluster: cluster
    user: sa1
    namespace: ns1
  name: cluster-context
current-context: cluster-context


`;

    (exec as jest.Mock)
      .mockResolvedValueOnce('sa1-token;service-account-token')
      .mockResolvedValueOnce('Zm9vYmFy')
      .mockResolvedValueOnce('cluster')
      .mockResolvedValueOnce('address||certificate');
    await namespaceKubeConfigCommand.handler({
      namespace: 'ns1',
      serviceAccount: 'sa1',
    } as any);
    expect((Logger as any).instance.output).toHaveBeenLastCalledWith(result);
  });

  it('should output the kube config base64 encoded', async () => {
    const result =
      `${EOL}${EOL}YXBpVmVyc2lvbjogdjEKa2luZDogQ29uZmlnCmNsdXN0ZXJzOgot` +
      'IGNsdXN0ZXI6CiAgICBzZXJ2ZXI6IGFkZHJlc3MKICAgIGNlcnRpZmljYXRlLWF1dGhvcml0eS1kY' +
      'XRhOiBjZXJ0aWZpY2F0ZQogIG5hbWU6IGNsdXN0ZXIKdXNlcnM6Ci0gbmFtZTogc2ExCiAgdXNlcj' +
      'oKICAgIHRva2VuOiBmb29iYXIKcHJlZmVyZW5jZXM6IHt9CmNvbnRleHRzOgotIGNvbnRleHQ6CiA' +
      'gICBjbHVzdGVyOiBjbHVzdGVyCiAgICB1c2VyOiBzYTEKICAgIG5hbWVzcGFjZTogbnMxCiAgbmFt' +
      `ZTogY2x1c3Rlci1jb250ZXh0CmN1cnJlbnQtY29udGV4dDogY2x1c3Rlci1jb250ZXh0Cg==${EOL}${EOL}`;

    (exec as jest.Mock)
      .mockResolvedValueOnce('sa1-token;service-account-token')
      .mockResolvedValueOnce('Zm9vYmFy')
      .mockResolvedValueOnce('cluster')
      .mockResolvedValueOnce('address||certificate');
    await namespaceKubeConfigCommand.handler({
      namespace: 'ns1',
      serviceAccount: 'sa1',
      base64: true,
    } as any);
    expect((Logger as any).instance.output).toHaveBeenLastCalledWith(result);
  });
});
