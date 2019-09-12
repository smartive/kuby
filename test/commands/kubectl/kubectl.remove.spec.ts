import { prompt } from 'inquirer';
import { vol } from 'memfs';
import { posix } from 'path';
import { kubectlRemoveCommand } from '../../../src/commands/kubectl/remove';
import * as Version from '../../../src/commands/version';
import { Filepathes } from '../../../src/utils/filepathes';
import { Logger } from '../../../src/utils/logger';
import { clearGlobalMocks } from '../../helpers';

describe('commands / kubectl / remove', () => {
  let versionInfo: jest.SpyInstance;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    versionInfo = jest.spyOn<any, any>(Version, 'getVersionInfo').mockResolvedValue({
      kubectlVersion: 'kubectlVersion',
    });
  });

  beforeEach(() => {
    vol.fromJSON({
      [posix.join(Filepathes.kubectlInstallPath, 'v1.12.1', 'kubectl')]: 'kubectl',
      [posix.join(Filepathes.kubectlInstallPath, 'v1.12.2', 'kubectl')]: 'kubectl',
      [posix.join(Filepathes.kubectlInstallPath, 'v1.10.0', 'kubectl')]: 'kubectl',
      [posix.join(Filepathes.kubectlInstallPath, 'v1.8.4', 'kubectl')]: 'kubectl',
    });
    vol.mkdirpSync('/usr/local/bin/');
    vol.symlinkSync(posix.join(Filepathes.kubectlInstallPath, 'v1.10.0', 'kubectl'), '/usr/local/bin/kubectl');
  });

  afterEach(() => {
    clearGlobalMocks();
    versionInfo.mockClear();
  });

  afterAll(() => {
    versionInfo.mockRestore();
  });

  it('should ask the user if no semver version is provided', async () => {
    ((prompt as any) as jest.Mock).mockResolvedValue({ version: '1.8.4' });
    await kubectlRemoveCommand.handler({} as any);
    expect(prompt).toHaveBeenCalled();
  });

  it('should warn when the version is not locally installed', async () => {
    await kubectlRemoveCommand.handler({ semver: '2' } as any);
    expect((Logger as any).instance.warn).toHaveBeenLastCalledWith('The given semver is not locally installed.');
  });

  it('should remove the version folder', async () => {
    await kubectlRemoveCommand.handler({ semver: '1.8' } as any);
    expect(Object.keys(vol.toJSON())).not.toContain(posix.join(Filepathes.kubectlInstallPath, 'v1.8.4', 'kubectl'));
  });

  it('should remove the symlink to the kubectl executable', async () => {
    expect(vol.existsSync('/usr/local/bin/kubectl')).toBe(true);
    await kubectlRemoveCommand.handler({ semver: '1.8' } as any);
    expect(vol.existsSync('/usr/local/bin/kubectl')).toBe(false);
  });
});
