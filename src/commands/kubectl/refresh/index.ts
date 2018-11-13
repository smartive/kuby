import { ensureFile, writeJson } from 'fs-extra';
import { CommandModule } from 'yargs';

import { Logger } from '../../../utils/logger';
import { downloadRemoteVersions, kubectlVersionsFile } from '../utils/kubectl';

export const kubectlRefreshCommand: CommandModule = {
  command: 'refresh',
  describe:
    'Get all kubernetes releases from github api and store them locally.',

  async handler(): Promise<void> {
    const logger = new Logger('kubectl');
    logger.debug('Refresh online kubernetes release versions');

    await ensureFile(kubectlVersionsFile);

    const versions = await downloadRemoteVersions();
    await writeJson(kubectlVersionsFile, versions, { encoding: 'utf8' });

    logger.success('Versions refreshed.');
  },
};
