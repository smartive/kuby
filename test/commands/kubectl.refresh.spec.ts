import { vol } from 'memfs';
import { EOL } from 'os';

import { kubectlRefreshCommand } from '../../src/commands/kubectl/refresh';
import * as Helpers from '../../src/commands/kubectl/utils/kubectl';
import { Filepathes } from '../../src/utils/filepathes';
import { clearGlobalMocks } from '../helpers';

describe('commands / kubectl / refresh', () => {
  let download: jest.Mock;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    download = jest
      .spyOn(Helpers, 'downloadRemoteVersions')
      .mockResolvedValue([]);
  });

  afterEach(() => {
    clearGlobalMocks();
    download.mockClear();
  });

  afterAll(() => {
    download.mockRestore();
  });

  it('should create the versions file', async () => {
    await kubectlRefreshCommand.handler({});
    expect(Object.keys(vol.toJSON())).toContain(Filepathes.kubectlVersionsPath);
  });

  it('should write kubectl versions', async () => {
    download.mockResolvedValue(['1.10.0', '1.12.0']);
    await kubectlRefreshCommand.handler({});
    expect(vol.toJSON()).toEqual({
      [Filepathes.kubectlVersionsPath]: `${JSON.stringify([
        '1.10.0',
        '1.12.0',
      ])}${EOL}`,
    });
  });
});
