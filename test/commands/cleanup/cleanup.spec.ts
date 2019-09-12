import { Arguments } from 'yargs';
import { CleanupArguments, cleanupCommand } from '../../../src/commands/cleanup';
import { exec } from '../../../src/utils/exec';
import { LogLevel } from '../../../src/utils/logger';
import * as Confirm from '../../../src/utils/simple-confirm';
import { spawn } from '../../../src/utils/spawn';
import { clearGlobalMocks } from '../../helpers';

const defaultArgs: Arguments<CleanupArguments> = {
  names: [],
  resources: ['ingress', 'service', 'deployment', 'pvc', 'configmap', 'secret', 'certificate'],
  dryRun: false,
  ci: false,
  logLevel: LogLevel.info,
  _: [],
  $0: '',
};

const demoResources = `Ingress|demo-1|ns-1
Ingress|demo-2|ns-1
Ingress|demo-3|ns-1
Service|foo-demo-bar|ns-1
Deployment|asdf-qwer|ns-1
`;

describe('commands / cleanup', () => {
  let confirm: jest.SpyInstance;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    confirm = jest.spyOn(Confirm, 'simpleConfirm').mockResolvedValue(true);
  });

  afterEach(() => {
    clearGlobalMocks();
    confirm.mockClear();
  });

  afterAll(() => {
    confirm.mockRestore();
  });

  it('should call for the default resources', async () => {
    (exec as jest.Mock).mockResolvedValueOnce('');
    await cleanupCommand.handler(defaultArgs);
    expect(exec).toHaveBeenCalledWith(
      `kubectl  get ingress,service,deployment,pvc,configmap,secret,certificate -o jsonpath=\"{range $.items[*]}{.kind}|{.metadata.name}|{.metadata.namespace}{'\\n'}{end}\"`,
    );
  });

  it('should correctly parse given resources', async () => {
    (exec as jest.Mock).mockResolvedValueOnce('');
    await cleanupCommand.handler({
      ...defaultArgs,
      resources: ['ing,svc', 'cm'],
    });
    expect(exec).toHaveBeenCalledWith(
      `kubectl  get ing,svc,cm -o jsonpath=\"{range $.items[*]}{.kind}|{.metadata.name}|{.metadata.namespace}{'\\n'}{end}\"`,
    );
  });

  it('should filter the correct resources in exact mode', async () => {
    (exec as jest.Mock).mockResolvedValueOnce(demoResources);
    await cleanupCommand.handler({
      ...defaultArgs,
      exactMatch: true,
      names: ['demo-1', 'demo-2'],
    });
    expect(spawn).toHaveBeenCalledWith('kubectl', ['delete', 'Ingress/demo-1', 'Ingress/demo-2']);
  });

  it('should filter the correct resources in partial mode', async () => {
    (exec as jest.Mock).mockResolvedValueOnce(demoResources);
    await cleanupCommand.handler({
      ...defaultArgs,
      names: ['demo', 'asdf'],
    });
    expect(spawn).toHaveBeenCalledWith('kubectl', [
      'delete',
      'Ingress/demo-1',
      'Ingress/demo-2',
      'Ingress/demo-3',
      'Service/foo-demo-bar',
      'Deployment/asdf-qwer',
    ]);
  });

  it('should filter the correct resources in regex mode', async () => {
    (exec as jest.Mock).mockResolvedValueOnce(demoResources);
    await cleanupCommand.handler({
      ...defaultArgs,
      regex: true,
      names: ['demo-\\d'],
    });
    expect(spawn).toHaveBeenCalledWith('kubectl', ['delete', 'Ingress/demo-1', 'Ingress/demo-2', 'Ingress/demo-3']);
  });

  it('should not do anything if resulting list is empty', async () => {
    (exec as jest.Mock).mockResolvedValueOnce(demoResources);
    await cleanupCommand.handler({
      ...defaultArgs,
      exactMatch: true,
      names: ['asdfasdfasdf'],
    });
    expect(spawn).not.toHaveBeenCalled();
  });

  it('should do nothing if in dry run mode', async () => {
    (exec as jest.Mock).mockResolvedValueOnce(demoResources);
    await cleanupCommand.handler({
      ...defaultArgs,
      dryRun: true,
      names: ['demo'],
    });
    expect(spawn).not.toHaveBeenCalled();
  });

  it('should ask the user to proceed if not in ci mode', async () => {
    (exec as jest.Mock).mockResolvedValueOnce(demoResources);
    await cleanupCommand.handler({
      ...defaultArgs,
      names: ['demo'],
    });
    expect(confirm).toHaveBeenCalled();
    expect(spawn).toHaveBeenCalled();
  });

  it('should not ask the user to proceed if in ci mode', async () => {
    (exec as jest.Mock).mockResolvedValueOnce(demoResources);
    await cleanupCommand.handler({
      ...defaultArgs,
      ci: true,
      names: ['demo'],
    });
    expect(confirm).not.toHaveBeenCalled();
    expect(spawn).toHaveBeenCalled();
  });
});
