import { pathExists, readdir, stat } from 'fs-extra';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../root-arguments';
import { ExitCode } from '../../utils/exit-code';
import { Logger } from '../../utils/logger';
import { RcFile } from '../../utils/rc-file';
import { spawn } from '../../utils/spawn';
import { kubeConfigCommand } from '../kube-config';

interface ApplyArguments extends Arguments, RootArguments {
  deployFolder: string;
}

interface ApplyCommandModule extends CommandModule {
  handler(args: ApplyArguments): Promise<void>;
}

export const applyCommand: ApplyCommandModule = {
  command: 'apply [deployFolder]',
  describe: 'Apply all prepared yaml files with kubectl.',

  builder: (argv: Argv) =>
    argv
      .positional('deployFolder', {
        default: './deployment/',
        description: 'Folder with prepared yaml (k8s) files.',
        type: 'string',
        normalize: true,
      })
      .completion('completion', false as any, async (_, argv: Arguments) => {
        if (argv._.length >= 3) {
          return [];
        }
        const dirs = [];
        const directory = await readdir(process.cwd());
        for (const path of directory) {
          const stats = await stat(path);
          if (stats.isDirectory()) {
            dirs.push(path);
          }
        }
        return dirs;
      }),

  async handler(args: ApplyArguments): Promise<void> {
    if (args.getYargsCompletions) {
      return;
    }

    const logger = new Logger('deployment');
    logger.debug('Apply yaml files');

    if (!(await pathExists(args.deployFolder))) {
      logger.error('Deploy directory does not exist. Aborting.');
      process.exit(ExitCode.error);
      return;
    }

    if (args.ci) {
      await kubeConfigCommand.handler({
        ...args,
        noInteraction: true,
      });
    }

    const code = await spawn(
      'kubectl',
      RcFile.getKubectlArguments(args, ['apply', '-f', args.deployFolder]),
    );

    if (code !== 0) {
      logger.error('An error happend during the kubectl command.');
      process.exit(ExitCode.error);
      return;
    }

    logger.success('Files applied.');
  },
};
