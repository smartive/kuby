import chalk from 'chalk';
import { CommandModule } from 'yargs';

import { getVersionInfo } from '../../version';
import { getLocalVersions } from '../utils/kubectl';

export const kubectlListCommand: CommandModule = {
  command: 'list',
  aliases: 'ls',
  describe: 'List local available kubectl versions.',

  async handler(): Promise<void> {
    console.group(chalk.underline('List kubectl installations'));

    const versions = await getLocalVersions();
    const { kubectlVersion } = await getVersionInfo();
    if (versions.length === 0) {
      console.log('No local installations found.');
      console.groupEnd();
      return;
    }

    console.log('Local available kubectl versions:');
    versions.forEach(v =>
      console.log(
        `v${v} (~/.kube/k8s-helpers/kubectl/v${v})${
          v === kubectlVersion ? chalk.green(' selected') : ''
        }`,
      ),
    );

    console.groupEnd();
  },
};
