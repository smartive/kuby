import { vol } from 'memfs';
import { homedir } from 'os';
import { posix } from 'path';

import { kubectlInstallCommand } from '../../../src/commands/kubectl/install';
import { kubectlUseCommand } from '../../../src/commands/kubectl/use';
import * as Helpers from '../../../src/commands/kubectl/utils/kubectl';
import { Logger } from '../../../src/utils/logger';
import * as Confirm from '../../../src/utils/simple-confirm';
import { clearGlobalMocks } from '../../helpers';

describe('commands / kubectl / install', () => {
  let use: jest.Mock;
  let confirm: jest.Mock;

  let remoteVersions: jest.Mock;
  let localVersions: jest.Mock;
  let download: jest.Mock;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    use = jest.spyOn(kubectlUseCommand, 'handler').mockResolvedValue(undefined);
    confirm = jest.spyOn(Confirm, 'simpleConfirm').mockResolvedValue(true);
    remoteVersions = jest.spyOn(Helpers, 'getRemoteVersions').mockResolvedValue([]);
    localVersions = jest.spyOn(Helpers, 'getLocalVersions').mockResolvedValue([]);
    download = jest.spyOn(Helpers, 'downloadKubectl').mockResolvedValue(undefined);
  });

  afterEach(() => {
    clearGlobalMocks();
    use.mockClear();
    confirm.mockClear();
    remoteVersions.mockClear();
    localVersions.mockClear();
    download.mockClear();
  });

  afterAll(() => {
    use.mockRestore();
    confirm.mockRestore();
    remoteVersions.mockRestore();
    localVersions.mockRestore();
    download.mockRestore();
  });

  it('should return when used with completion args', async () => {
    expect(await kubectlInstallCommand.handler({ getYargsCompletions: true } as any)).toBeUndefined();
    expect((Logger as any).instance).toBeUndefined();
  });

  it('should create the kubectl install dir when it does not exist', async () => {
    await kubectlInstallCommand.handler({} as any);
    const installDir = posix.join(homedir(), '.kube', 'kuby', 'kubectl');
    expect(Object.keys(vol.toJSON())).toContain(installDir);
  });

  it('should exit if the given semver is not available', async () => {
    remoteVersions.mockResolvedValue(['1.10.0']);
    await kubectlInstallCommand.handler({ semver: '2' } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error.mock.calls[0][0]).toBe(
      'The given semver is not available. Use other version or use the refresh command.',
    );
  });

  it('should not download a version when force not set', async () => {
    remoteVersions.mockResolvedValue(['1.10.0']);
    localVersions.mockResolvedValue(['1.10.0']);
    await kubectlInstallCommand.handler({ semver: '1' } as any);
    expect(use).toHaveBeenCalled();
    expect((Logger as any).instance.info.mock.calls[0][0]).toBe('v1.10.0 already installed and no force flag set.');
  });

  it('should ask the user if it should overwrite the version', async () => {
    remoteVersions.mockResolvedValue(['1.10.0']);
    localVersions.mockResolvedValue([]);
    await kubectlInstallCommand.handler({ semver: '1' } as any);
    expect(confirm).toHaveBeenCalled();
  });

  it('should abort when the user decides to keep the version', async () => {
    remoteVersions.mockResolvedValue(['1.10.0']);
    localVersions.mockResolvedValue([]);
    confirm.mockResolvedValue(false);
    await kubectlInstallCommand.handler({ semver: '1' } as any);
    expect(confirm).toHaveBeenCalled();
    expect((Logger as any).instance.info.mock.calls[0][0]).toBe('Aborting');
  });

  it('should force a download when force flag is set', async () => {
    remoteVersions.mockResolvedValue(['1.10.0']);
    localVersions.mockResolvedValue(['1.10.0']);
    await kubectlInstallCommand.handler({
      semver: '1',
      force: true,
      noInteraction: true,
    } as any);
    expect(download).toHaveBeenCalled();
  });

  it('should not ask the user if noInteraction is set', async () => {
    remoteVersions.mockResolvedValue(['1.10.0']);
    localVersions.mockResolvedValue([]);
    await kubectlInstallCommand.handler({
      semver: '1',
      noInteraction: true,
    } as any);
    expect(download).toHaveBeenCalled();
  });

  it('should download a version and call the use command', async () => {
    remoteVersions.mockResolvedValue(['1.10.0']);
    localVersions.mockResolvedValue([]);
    await kubectlInstallCommand.handler({
      semver: '1',
      noInteraction: true,
    } as any);
    expect(download).toHaveBeenCalled();
    expect(use).toHaveBeenCalled();
  });
});
