import chalk from 'chalk';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../root-arguments';
import { ExitCode } from '../../utils/exit-code';
import { spawn } from '../../utils/spawn';
import { kubeConfigCommand } from '../kube-config';
import { prepareCommand } from '../prepare';

interface DeleteArguments extends Arguments, RootArguments {
  sourceFolder: string;
  destinationFolder: string;
}

export const deleteCommand: CommandModule = {
  command: 'delete [sourceFolder] [destinationFolder]',
  aliases: 'del',
  describe: 'Prepare yaml files and execute DELETE on them.',

  builder: (argv: Argv) =>
    argv
      .positional('sourceFolder', {
        description: 'Folder to search for yaml files.',
        type: 'string',
        default: './k8s/',
      })
      .positional('destinationFolder', {
        description: 'Folder to put prepared yaml files in.',
        type: 'string',
        default: './deployment/',
      }),

  async handler(args: DeleteArguments): Promise<void> {
    console.group(chalk.underline('Delete deployment'));

    await prepareCommand.handler(args);

    if (args.ci) {
      await kubeConfigCommand.handler({
        ...args,
        noInteraction: true,
      });
    }

    const code = await spawn('kubectl', [
      'delete',
      '-f',
      args.destinationFolder,
    ]);
    if (code !== 0) {
      console.error(chalk.red('An error happend during the kubectl command.'));
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    console.log(chalk.green('Deployments deleted.'));
    console.groupEnd();
  },
};
