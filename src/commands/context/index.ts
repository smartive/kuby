import chalk from 'chalk';
import { prompt } from 'inquirer';
import { Arguments, Argv, CommandModule } from 'yargs';

import { exec } from '../../utils/exec';
import { ExitCode } from '../../utils/exit-code';
import { getContexts, getCurrentContext } from './utils/kubectx';

interface ContextArguments extends Arguments {
  name?: string;
}

export const contextCommand: CommandModule = {
  command: 'context [name]',
  aliases: 'ctx',
  describe:
    'Utilities for kubernetes contexts. Without any subcommands, ' +
    'prints a list of possible configured contexts.',

  builder: (argv: Argv) =>
    argv.positional('name', {
      description: 'Context to switch to. If omitted, user is asked.',
      type: 'string',
    }),

  async handler(args: ContextArguments): Promise<void> {
    console.group(chalk.underline(`List / Switch context`));

    const current = await getCurrentContext();
    const contexts = await getContexts();

    if (!args.name) {
      args.name = ((await prompt([
        {
          type: 'list',
          name: 'context',
          message: `Which context do you want to use?`,
          choices: contexts,
          default: current,
        },
      ])) as { context: string }).context;
    }

    if (current === args.name) {
      console.log('No different context selected, exiting.');
      console.groupEnd();
      return;
    }

    if (!contexts.includes(args.name)) {
      console.error(chalk.red(`The context "${args.name}" does not exist.`));
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    await exec(`kubectl config use-context "${args.name}"`);
    console.log(`Active context is now "${chalk.yellow(args.name)}".`);
    console.groupEnd();
  },
};
