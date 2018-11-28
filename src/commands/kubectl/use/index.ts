import { remove, symlink } from 'fs-extra';
import { prompt } from 'inquirer';
import { platform } from 'os';
import { posix } from 'path';
import { maxSatisfying } from 'semver';
import { Arguments, Argv, CommandModule } from 'yargs';

import { ExitCode } from '../../../utils/exit-code';
import { Filepathes } from '../../../utils/filepathes';
import { Logger } from '../../../utils/logger';
import { getVersionInfo } from '../../version';
import { getLocalVersions } from '../utils/kubectl';

interface KubectlUseArguments extends Arguments {
  semver?: string;
}

interface KubectlUseCommandModule extends CommandModule {
  handler(args: KubectlUseArguments): Promise<void>;
}

export const kubectlUseCommand: KubectlUseCommandModule = {
  command: 'use [semver]',
  describe: 'Use a specific version of kubectl (symlink it).',

  builder: (argv: Argv) =>
    argv.positional('semver', {
      description: 'Semver version of the kubectl version to use.',
      type: 'string',
    }),

  async handler(args: KubectlUseArguments): Promise<void> {
    const logger = new Logger('kubectl');
    logger.debug('Use kubectl version');

    const versions = await getLocalVersions();
    const { kubectlVersion } = await getVersionInfo();
    if (!args.semver) {
      const answers = (await prompt([
        {
          type: 'list',
          name: 'version',
          message: `Which version do you want to use? (current: v${kubectlVersion})`,
          choices: [...versions.map(v => ({ value: v, name: `v${v}` }))],
        },
      ])) as { version: string };
      args.semver = answers.version;
    }

    const installVersion = maxSatisfying(versions, args.semver);

    if (!installVersion) {
      logger.error(
        'The given semver is not locally available. Use the install command.',
      );
      process.exit(ExitCode.error);
      return;
    }

    logger.debug(`Redirect the symlink to v${installVersion}.`);
    if (platform() !== 'win32') {
      await remove('/usr/local/bin/kubectl');
      await symlink(
        posix.join(
          Filepathes.kubectlInstallPath,
          `v${installVersion}`,
          'kubectl',
        ),
        '/usr/local/bin/kubectl',
        'file',
      );
    }
    // TODO windows.

    logger.success(`Version changed to v${installVersion}.`);
  },
};
