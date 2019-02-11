import chalk from 'chalk';

import { kubectlListCommand } from '../../../src/commands/kubectl/list';
import * as Helpers from '../../../src/commands/kubectl/utils/kubectl';
import * as Version from '../../../src/commands/version';
import { Logger } from '../../../src/utils/logger';
import { clearGlobalMocks } from '../../helpers';

describe('commands / kubectl / list', () => {
  let versionInfo: jest.Mock;
  let localVersions: jest.Mock;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    versionInfo = jest.spyOn(Version, 'getVersionInfo').mockResolvedValue({
      kubectlVersion: 'kubectlversion',
    });
    localVersions = jest.spyOn(Helpers, 'getLocalVersions').mockResolvedValue([]);
  });

  afterEach(() => {
    clearGlobalMocks();
    localVersions.mockClear();
    versionInfo.mockClear();
  });

  afterAll(() => {
    localVersions.mockRestore();
    versionInfo.mockRestore();
  });

  it('should warn when no local installations are found', async () => {
    localVersions.mockResolvedValue([]);
    await kubectlListCommand.handler({} as any);
    expect((Logger as any).instance.warn.mock.calls[0][0]).toBe('No local installations found.');
  });

  it('should list local versions', async () => {
    localVersions.mockResolvedValue(['1.10.0']);
    await kubectlListCommand.handler({} as any);
    expect((Logger as any).instance.info.mock.calls[1][0]).toBe('v1.10.0 (~/.kube/kuby/kubectl/v1.10.0)');
  });

  it('should highlight the selected version', async () => {
    localVersions.mockResolvedValue(['1.10.0']);
    versionInfo.mockResolvedValue({
      kubectlVersion: '1.10.0',
    });
    await kubectlListCommand.handler({} as any);
    expect((Logger as any).instance.info.mock.calls[1][0]).toBe(
      `v1.10.0 (~/.kube/kuby/kubectl/v1.10.0)${chalk.green(' selected')}`,
    );
  });
});
