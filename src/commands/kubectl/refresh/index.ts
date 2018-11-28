import { ensureFile, writeJson } from 'fs-extra';
import { CommandModule } from 'yargs';

import { Filepathes } from '../../../utils/filepathes';
import { Logger } from '../../../utils/logger';
import { downloadRemoteVersions } from '../utils/kubectl';

export const kubectlRefreshCommand: CommandModule = {
  command: 'refresh',
  describe:
    'Get all kubernetes releases from github api and store them locally.',

  async handler(): Promise<void> {
    const logger = new Logger('kubectl');
    logger.debug('Refresh online kubernetes release versions');

    await ensureFile(Filepathes.kubectlVersionsPath);

    const versions = await downloadRemoteVersions(logger);
    await writeJson(Filepathes.kubectlVersionsPath, versions, {
      encoding: 'utf8',
    });

    logger.success('Versions refreshed.');
  },
};
