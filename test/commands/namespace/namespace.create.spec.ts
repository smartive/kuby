import { prompt } from 'inquirer';
import { vol } from 'memfs';
import * as Kubectx from '../../../src/commands/context/utils/kubectx';
import { namespaceCreateCommand } from '../../../src/commands/namespace/create';
import { namespaceKubeConfigCommand } from '../../../src/commands/namespace/kube-config';
import * as Kubens from '../../../src/commands/namespace/utils/kubens';
import { exec } from '../../../src/utils/exec';
import { Filepathes } from '../../../src/utils/filepathes';
import { Logger } from '../../../src/utils/logger';
import * as Confirm from '../../../src/utils/simple-confirm';
import { spawn } from '../../../src/utils/spawn';
import { clearGlobalMocks } from '../../helpers';

describe('commands / namespace / create', () => {
  let currentContext: jest.SpyInstance;
  let namespaces: jest.SpyInstance;
  let confirm: jest.SpyInstance;
  let kubeConfigCommand: jest.SpyInstance;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    currentContext = jest.spyOn(Kubectx, 'getCurrentContext').mockResolvedValue('context');
    namespaces = jest.spyOn(Kubens, 'getNamespaces').mockResolvedValue(['ns1', 'ns2']);
    confirm = jest.spyOn(Confirm, 'simpleConfirm').mockResolvedValue(true);
    kubeConfigCommand = jest.spyOn<any, any>(namespaceKubeConfigCommand, 'handler').mockResolvedValue(undefined);
  });

  afterEach(() => {
    clearGlobalMocks();
    currentContext.mockClear();
    namespaces.mockClear();
    confirm.mockClear();
    kubeConfigCommand.mockClear();
  });

  afterAll(() => {
    currentContext.mockRestore();
    namespaces.mockRestore();
    confirm.mockRestore();
    kubeConfigCommand.mockRestore();
  });

  it('should fail if the given name already exists', async () => {
    await namespaceCreateCommand.handler({ name: 'ns1' } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith('The namespace "ns1" already exists.');
  });

  it('should load the default role file if one exists', async () => {
    vol.fromJSON({
      [Filepathes.namespaceDefaultRolePath]: 'foobar',
    });
    await namespaceCreateCommand.handler({ name: 'ns3' } as any);
    expect(((prompt as any) as jest.Mock).mock.calls[0][0].map((q: any) => q.default)[2]).toBe('foobar');
  });

  it('should use the default role if no file exists', async () => {
    await namespaceCreateCommand.handler({ name: 'ns3' } as any);
    expect(((prompt as any) as jest.Mock).mock.calls[0][0].map((q: any) => q.default)[2]).toMatch(/kind: Role/g);
  });

  it('should ask the user for certain information', async () => {
    await namespaceCreateCommand.handler({ name: 'ns3' } as any);
    expect(prompt).toHaveBeenCalled();
  });

  it('should use biased information when using no-interaction mode', async () => {
    await namespaceCreateCommand.handler({ name: 'ns3', noInteraction: true } as any);
    expect(prompt).not.toHaveBeenCalled();
  });

  it('should write the default role file when user selects to save the role', async () => {
    ((prompt as any) as jest.Mock).mockImplementationOnce(async () => ({
      createServiceAccount: true,
      serviceAccountName: 'name',
      saveRole: true,
      role: 'myNewRole',
    }));
    await namespaceCreateCommand.handler({ name: 'ns3' } as any);
    expect(vol.readFileSync(Filepathes.namespaceDefaultRolePath, 'utf8')).toBe('myNewRole');
  });

  it('should abort if the user does not want to create the namespace', async () => {
    confirm.mockResolvedValueOnce(false);
    await namespaceCreateCommand.handler({ name: 'ns3' } as any);
    expect((Logger as any).instance.info).toHaveBeenLastCalledWith('Aborting');
  });

  it('should not ask the user to proceed if in no-interaction mode', async () => {
    await namespaceCreateCommand.handler({ name: 'ns3', noInteraction: true } as any);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('should create the namespace', async () => {
    await namespaceCreateCommand.handler({ name: 'ns3', noInteraction: true } as any);
    expect(spawn).toHaveBeenCalledWith('kubectl', ['create', 'ns', 'ns3']);
  });

  it('should fail if "create ns" failes', async () => {
    (spawn as jest.Mock).mockResolvedValueOnce(1);
    await namespaceCreateCommand.handler({ name: 'ns3', noInteraction: true } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should fail if no role name is provided', async () => {
    ((prompt as any) as jest.Mock).mockImplementationOnce(async () => ({
      createServiceAccount: true,
      serviceAccountName: 'name',
      saveRole: false,
      role: 'myNewRole',
    }));
    await namespaceCreateCommand.handler({ name: 'ns3' } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error).toHaveBeenCalledWith('No valid role name provided. aborting.');
  });

  it('should execute the creation of rolebindings and service accounts', async () => {
    await namespaceCreateCommand.handler({ name: 'ns3', noInteraction: true } as any);
    expect(exec).toHaveBeenCalled();
  });

  it('should fail if exec kubectl throws an error', async () => {
    (exec as jest.Mock).mockRejectedValueOnce('Error');
    await namespaceCreateCommand.handler({ name: 'ns3', noInteraction: true } as any);
    expect(exec).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error).toHaveBeenCalledWith('Error: Error');
  });

  it('should call namespace kubeconfig command to output the kubeconfig', async () => {
    await namespaceCreateCommand.handler({ name: 'ns3', noInteraction: true } as any);
    expect(kubeConfigCommand).toHaveBeenCalled();
  });

  it.skip('TODO: should call namespace kubeconfig command with --ci mode', async () => {});
});
