import * as chalk from 'chalk';
import { prompt } from 'inquirer';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../root-arguments';
import { exec } from '../../utils/exec';
import { ExitCode } from '../../utils/exit-code';
import { Logger } from '../../utils/logger';
import { getContexts, getCurrentContext } from './utils/kubectx';

const fuzzy = require('fuzzy');

export const contextCommand: CommandModule<
  RootArguments,
  {
    name?: string;
  }
> = {
  command: 'context [name]',
  aliases: 'ctx',
  describe:
    'Utilities for kubernetes contexts. Without any subcommands, ' + 'prints a list of possible configured contexts.',

  builder: (argv: Argv) =>
    argv
      .positional('name', {
        description: 'Context to switch to. If omitted, user is asked.',
        type: 'string',
      })
      .completion('completion', false as any, async (_, argv: Arguments) => (argv._.length >= 3 ? [] : await getContexts())),

  async handler(
    args: Arguments<{
      name?: string;
    }>,
  ): Promise<void> {
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
          type: 'autocomplete',
          name: 'context',
          message: `Which context do you want to use? ${chalk.dim(`(current: ${current})`)}`,
          source: async (_: any, input: string) => {
            if (!input) {
              return contexts;
            }
            return fuzzy
              .filter(input.replace(/\s/g, ''), contexts, {
                pre: '{',
                post: '}',
              })
              .map((e: any) => ({
                name: e.string.replace(/{(.)}/g, chalk.underline('$1')),
                value: e.original,
              }));
          },
        } as any,
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
