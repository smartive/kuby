import chalk from 'chalk';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootOptions } from '../../root-options';
import { applyCommand } from '../apply';
import { prepareCommand } from '../prepare';

interface DeployArguments extends Arguments, RootOptions {
  sourceFolder: string;
  destinationFolder: string;
}

export const deployCommand: CommandModule = {
  command: 'deploy [sourceFolder] [destinationFolder]',
  aliases: 'dep',
  describe: 'Prepare and deploy all found yaml files.',

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

  async handler(args: DeployArguments): Promise<void> {
    console.group(chalk.underline('Execute deployment'));

    await prepareCommand.handler(args);
    await applyCommand.handler({
      ...args,
      deployFolder: args.destinationFolder,
    });

    console.log(chalk.green('Deployments applied.'));
    console.groupEnd();
  },
};
