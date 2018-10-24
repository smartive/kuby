import chalk from 'chalk';
import { ensureFile, writeJson } from 'fs-extra';
import { CommandModule } from 'yargs';

import { downloadRemoteVersions, kubectlVersionsFile } from '../utils/kubectl';

export const kubectlRefreshCommand: CommandModule = {
  command: 'refresh',
  describe:
    'Get all kubernetes releases from github api and store them locally.',

  async handler(): Promise<void> {
    console.group(
      chalk.underline('Refresh online kubernetes release versions'),
    );
    await ensureFile(kubectlVersionsFile);

    const versions = await downloadRemoteVersions();
    await writeJson(kubectlVersionsFile, versions, { encoding: 'utf8' });

    console.log(chalk.green('Versions refreshed.'));
    console.groupEnd();
  },
};
