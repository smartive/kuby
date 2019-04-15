import { ensureFile } from 'fs-extra';
import * as Got from 'got';
import { vol } from 'memfs';
import { EOL } from 'os';
import { posix } from 'path';

import * as Helpers from '../../../src/commands/kubectl/utils/kubectl';
import { Filepathes } from '../../../src/utils/filepathes';
import { clearGlobalMocks } from '../../helpers';

describe('commands / kubectl / utils / kubectl', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  describe('getLocalVersions()', () => {
    it('should create the installation dir if it does not exist', async () => {
      await Helpers.getLocalVersions();
      expect(Object.keys(vol.toJSON())).toContain(Filepathes.kubectlInstallPath);
    });

    it('should return the possible versions', async () => {
      vol.mkdirpSync(posix.join(Filepathes.kubectlInstallPath, 'v1.10.0'));
      vol.mkdirpSync(posix.join(Filepathes.kubectlInstallPath, 'v1.12.0'));
      vol.mkdirpSync(posix.join(Filepathes.kubectlInstallPath, 'v1.13.0'));
      const result = await Helpers.getLocalVersions();
      expect(result).toEqual(['1.13.0', '1.12.0', '1.10.0']);
    });

    it('should filter files (only return directories)', async () => {
      vol.mkdirpSync(posix.join(Filepathes.kubectlInstallPath, 'v1.10.0'));
      vol.mkdirpSync(posix.join(Filepathes.kubectlInstallPath, 'v1.12.0'));
      vol.mkdirpSync(posix.join(Filepathes.kubectlInstallPath, 'v1.13.0'));
      await ensureFile(posix.join(Filepathes.kubectlInstallPath, 'foobar'));
      const result = await Helpers.getLocalVersions();
      expect(result).toEqual(['1.13.0', '1.12.0', '1.10.0']);
    });

    it('should filter invalid versions', async () => {
      vol.mkdirpSync(posix.join(Filepathes.kubectlInstallPath, 'v1.10.0'));
      vol.mkdirpSync(posix.join(Filepathes.kubectlInstallPath, 'v1.12.0'));
      vol.mkdirpSync(posix.join(Filepathes.kubectlInstallPath, 'v1.13.0'));
      vol.mkdirpSync(posix.join(Filepathes.kubectlInstallPath, 'miepmiep'));
      const result = await Helpers.getLocalVersions();
      expect(result).toEqual(['1.13.0', '1.12.0', '1.10.0']);
    });
  });

  describe('downloadRemoteVersions()', () => {
    let get: jest.Mock;

    beforeAll(() => {
      get = jest.spyOn<any, any>(Got, 'get').mockResolvedValue({
        body: JSON.stringify([
          {
            tag_name: 'v1.1.1',
          },
          {
            tag_name: 'v2.2.2',
          },
          {
            tag_name: 'v3.3.3',
          },
        ]),
        headers: {
          link: '',
        },
      });
    });

    afterEach(() => {
      get.mockClear();
    });

    afterAll(() => {
      get.mockRestore();
    });

    it('should download all returned versions', async () => {
      const versions = await Helpers.downloadRemoteVersions();
      expect(versions).toEqual(['1.1.1', '2.2.2', '3.3.3']);
    });

    it('should use the correct (parsed) urls', async () => {
      get
        .mockResolvedValueOnce({
          body: JSON.stringify([
            {
              tag_name: 'v1.1.1',
            },
          ]),
          headers: {
            link:
              '<https://api.github.com/repositories/20580498/releases?per_page=100&page=2>; rel="next", ' +
              '<https://api.github.com/repositories/20580498/releases?per_page=100&page=3>; rel="last"',
          },
        })
        .mockResolvedValueOnce({
          body: JSON.stringify([
            {
              tag_name: 'v2.2.2',
            },
          ]),
          headers: {
            link:
              '<https://api.github.com/repositories/20580498/releases?per_page=100&page=1>; rel="prev", ' +
              '<https://api.github.com/repositories/20580498/releases?per_page=100&page=3>; rel="next", ' +
              '<https://api.github.com/repositories/20580498/releases?per_page=100&page=3>; rel="last", ' +
              '<https://api.github.com/repositories/20580498/releases?per_page=100&page=1>; rel="first"',
          },
        })
        .mockResolvedValueOnce({
          body: JSON.stringify([
            {
              tag_name: 'v3.3.3',
            },
          ]),
          headers: {
            link:
              '<https://api.github.com/repositories/20580498/releases?per_page=100&page=2>; rel="prev", ' +
              '<https://api.github.com/repositories/20580498/releases?per_page=100&page=1>; rel="first"',
          },
        });
      const versions = await Helpers.downloadRemoteVersions();
      expect(versions).toEqual(['1.1.1', '2.2.2', '3.3.3']);
      expect(get).toHaveBeenCalledTimes(3);

      expect(get).nthCalledWith(1, 'https://api.github.com/repos/kubernetes/kubernetes/releases?per_page=100');
      expect(get).nthCalledWith(2, 'https://api.github.com/repositories/20580498/releases?per_page=100&page=2');
      expect(get).nthCalledWith(3, 'https://api.github.com/repositories/20580498/releases?per_page=100&page=3');
    });

    it('should filter invalid versions', async () => {
      get.mockResolvedValue({
        body: JSON.stringify([
          {
            tag_name: 'v1.1.1',
          },
          {
            tag_name: 'vfoobar',
          },
        ]),
        headers: {
          link: '',
        },
      });
      const versions = await Helpers.downloadRemoteVersions();
      expect(versions).toEqual(['1.1.1']);
    });
  });

  describe('getRemoteVersions()', () => {
    let get: jest.Mock;

    beforeAll(() => {
      get = jest.spyOn<any, any>(Got, 'get').mockResolvedValue({
        body: JSON.stringify([
          {
            tag_name: 'v1.1.1',
          },
          {
            tag_name: 'v2.2.2',
          },
          {
            tag_name: 'v3.3.3',
          },
        ]),
        headers: {
          link: '',
        },
      });
    });

    afterEach(() => {
      get.mockClear();
    });

    afterAll(() => {
      get.mockRestore();
    });

    it('should return the versions file if it exists', async () => {
      vol.fromJSON({
        [Filepathes.kubectlVersionsPath]: `["1.13.0-rc.1","1.10.11","1.11.5"]${EOL}`,
      });
      const result = await Helpers.getRemoteVersions();
      expect(result).toEqual(['1.13.0-rc.1', '1.10.11', '1.11.5']);
    });

    it('should download the remove versions and write them to the disk', async () => {
      const result = await Helpers.getRemoteVersions();
      expect(get).toHaveBeenCalled();
      expect(result).toEqual(['1.1.1', '2.2.2', '3.3.3']);
      expect((vol.toJSON() as any)[Filepathes.kubectlVersionsPath]).toEqual(`["1.1.1","2.2.2","3.3.3"]${EOL}`);
    });
  });
});
