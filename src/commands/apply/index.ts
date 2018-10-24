import chalk from 'chalk';
import { pathExists } from 'fs-extra';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootOptions } from '../../root-options';
import { ExitCode } from '../../utils/exit-code';
import { spawn } from '../../utils/spawn';
import { kubeConfigCommand } from '../kube-config';

interface ApplyArguments extends Arguments, RootOptions {
  deployFolder: string;
}

interface ApplyCommandModule extends CommandModule {
  handler(args: ApplyArguments): Promise<void>;
}

export const applyCommand: ApplyCommandModule = {
  command: 'apply [deployFolder]',
  describe: 'Apply all prepared yaml files with kubectl.',

  builder: (argv: Argv) =>
    argv.positional('deployFolder', {
      default: './deployment/',
      description: 'Folder with prepared yaml (k8s) files.',
      type: 'string',
      normalize: true,
    }),

  async handler(args: ApplyArguments): Promise<void> {
    console.group(chalk.underline('Apply yaml files'));

    if (!(await pathExists(args.deployFolder))) {
      console.error(chalk.red('Deploy directory does not exist. Aborting.'));
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    if (args.ci) {
      await kubeConfigCommand.handler({
        ...args,
        noInteraction: true,
      });
    }

    const code = await spawn('kubectl', ['apply', '-f', args.deployFolder]);
    if (code !== 0) {
      console.error(chalk.red('An error happend during the kubectl command.'));
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    console.log(chalk.green('Files applied.'));
    console.groupEnd();
  },
};
