import chalk from 'chalk';
import { CommandModule } from 'yargs';

import { Logger } from '../../../utils/logger';
import { getVersionInfo } from '../../version';
import { getLocalVersions } from '../utils/kubectl';

export const kubectlListCommand: CommandModule = {
  command: 'list',
  aliases: 'ls',
  describe: 'List local available kubectl versions.',

  async handler(): Promise<void> {
    const logger = new Logger('kubectl');
    logger.debug('List kubectl installations');

    const versions = await getLocalVersions();
    const { kubectlVersion } = await getVersionInfo();
    if (versions.length === 0) {
      logger.warn('No local installations found.');
      return;
    }

    logger.info('Local available kubectl versions:');
    versions.forEach(v =>
      logger.info(
        `v${v} (~/.kube/k8s-helpers/kubectl/v${v})${
          v === kubectlVersion ? chalk.green(' selected') : ''
        }`,
      ),
    );
  },
};
