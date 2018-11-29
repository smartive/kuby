import { readFile } from 'fs-extra';
import { prompt } from 'inquirer';
import { vol } from 'memfs';
import { posix } from 'path';

import { kubectlUseCommand } from '../../src/commands/kubectl/use';
import * as Version from '../../src/commands/version';
import { Filepathes } from '../../src/utils/filepathes';
import { Logger } from '../../src/utils/logger';
import { clearGlobalMocks } from '../helpers';

describe('commands / kubectl / use', () => {
  let versionInfo: jest.Mock;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    versionInfo = jest.spyOn(Version, 'getVersionInfo').mockResolvedValue({
      kubectlVersion: 'kubectlVersion',
    });
  });

  beforeEach(() => {
    vol.fromJSON({
      [posix.join(
        Filepathes.kubectlInstallPath,
        'v1.12.1',
        'kubectl',
      )]: 'v1.12.1',
      [posix.join(
        Filepathes.kubectlInstallPath,
        'v1.12.2',
        'kubectl',
      )]: 'v1.12.2',
      [posix.join(
        Filepathes.kubectlInstallPath,
        'v1.10.0',
        'kubectl',
      )]: 'v1.10.0',
      [posix.join(Filepathes.kubectlInstallPath, 'v1.8.4', 'kubectl')]: 'v1.8.4',
    });
    vol.mkdirpSync('/usr/local/bin/');
    vol.symlinkSync(
      posix.join(Filepathes.kubectlInstallPath, 'v1.10.0', 'kubectl'),
      '/usr/local/bin/kubectl',
    );
  });

  afterEach(() => {
    clearGlobalMocks();
    versionInfo.mockClear();
  });

  afterAll(() => {
    versionInfo.mockRestore();
  });

  it('should ask the user if no semver version is provided', async () => {
    (prompt as jest.Mock).mockResolvedValue({ version: '1.8.4' });
    await kubectlUseCommand.handler({} as any);
    expect(prompt).toHaveBeenCalled();
  });

  it('should exit when the version is not locally installed', async () => {
    await kubectlUseCommand.handler({ semver: '2' } as any);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith(
      'The given semver is not locally available. Use the install command.',
    );
  });

  it('should create/redirect a new symlink', async () => {
    expect(await readFile('/usr/local/bin/kubectl', 'utf8')).toBe('v1.10.0');
    await kubectlUseCommand.handler({ semver: '1.8' } as any);
    expect(await readFile('/usr/local/bin/kubectl', 'utf8')).toBe('v1.8.4');
  });
});
