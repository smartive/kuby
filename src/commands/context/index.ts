import chalk from 'chalk';
import { prompt } from 'inquirer';
import { Arguments, Argv, CommandModule } from 'yargs';

import { exec } from '../../utils/exec';
import { ExitCode } from '../../utils/exit-code';
import { Logger } from '../../utils/logger';
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
    argv
      .positional('name', {
        description: 'Context to switch to. If omitted, user is asked.',
        type: 'string',
      })
      .completion('completion', false as any, async (_, argv: Arguments) =>
        argv._.length >= 3 ? [] : await getContexts(),
      ),

  async handler(args: ContextArguments): Promise<void> {
    if (args.getYargsCompletions) {
      return;
    }

    const logger = new Logger('contexts');
    logger.debug('list / switch contexts');

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
      logger.info('No different context selected, exiting.');
      return;
    }

    if (!contexts.includes(args.name)) {
      logger.error(`The context "${args.name}" does not exist.`);
      process.exit(ExitCode.error);
      return;
    }

    await exec(`kubectl config use-context "${args.name}"`);
    logger.info(`Active context is now "${chalk.green(args.name)}".`);
  },
};
