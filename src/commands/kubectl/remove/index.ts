import chalk from 'chalk';
import { remove } from 'fs-extra';
import { prompt } from 'inquirer';
import { platform } from 'os';
import { posix } from 'path';
import { maxSatisfying } from 'semver';
import { Arguments, Argv, CommandModule } from 'yargs';

import { Filepathes } from '../../../utils/filepathes';
import { Logger } from '../../../utils/logger';
import { getVersionInfo } from '../../version';
import { getLocalVersions } from '../utils/kubectl';

interface KubectlRemoveArguments extends Arguments {
  semver?: string;
}

export const kubectlRemoveCommand: CommandModule = {
  command: 'remove [semver]',
  aliases: 'rm',
  describe: 'Delete (locally) a version of kubectl.',

  builder: (argv: Argv) =>
    argv.positional('semver', {
      description: 'Semver version of the kubectl version to remove.',
      type: 'string',
    }),

  async handler(args: KubectlRemoveArguments): Promise<void> {
    const logger = new Logger('kubectl');
    logger.debug('Delete kubectl version');

    const versions = await getLocalVersions();
    const { kubectlVersion } = await getVersionInfo();
    if (!args.semver) {
      const answers = (await prompt([
        {
          type: 'list',
          name: 'version',
          message: `Which version do you want to delete? ${chalk.dim(
            `(current: v${kubectlVersion})`,
          )}`,
          choices: [
            ...versions.map(v => ({
              value: v,
              name: `v${v}`,
            })),
          ],
        },
      ])) as { version: string };
      args.semver = answers.version;
    }

    const removeVersion = maxSatisfying(versions, args.semver);

    if (!removeVersion) {
      logger.warn('The given semver is not locally installed.');
      return;
    }

    logger.debug('Delete folder.');
    await remove(
      posix.join(Filepathes.kubectlInstallPath, `v${removeVersion}`),
    );

    logger.debug('Delete symlink.');
    if (platform() !== 'win32') {
      await remove('/usr/local/bin/kubectl');
    }
    // TODO windows.

    logger.success(`Version v${removeVersion} removed.`);
  },
};
