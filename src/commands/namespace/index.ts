import chalk from 'chalk';
import { prompt } from 'inquirer';
import { Arguments, Argv, CommandModule } from 'yargs';

import { exec } from '../../utils/exec';
import { ExitCode } from '../../utils/exit-code';
import { Logger } from '../../utils/logger';
import { getCurrentContext } from '../context/utils/kubectx';
import { namespaceCreateCommand } from './create';
import { namespaceKubeConfigCommand } from './kube-config';
import { getCurrentNamespace, getNamespaces } from './utils/kubens';

const fuzzy = require('fuzzy');

interface NamespaceArguments extends Arguments {
  name?: string;
}

const namespaceCommands = [namespaceCreateCommand, namespaceKubeConfigCommand];

export const namespaceCommand: CommandModule = {
  command: 'namespace [name]',
  aliases: 'ns',
  describe:
    'Utilities for kubernetes namespaces. Without any subcommands, ' +
    'prints a list of possible namespaces in the current context. If provided ' +
    'with a name, the command switches directly to that namespace.',

  builder: (argv: Argv) => {
    argv
      .positional('name', {
        description: 'Namespace to switch to. If omitted, user is asked.',
        type: 'string',
      })
      .completion('completion', false as any, async (_, argv: Arguments) =>
        argv._.length >= 3 ? [] : await getNamespaces(),
      );
    return namespaceCommands.reduce((_, cur) => argv.command(cur), argv);
  },

  async handler(args: NamespaceArguments): Promise<void> {
    if (args.getYargsCompletions) {
      return;
    }

    const logger = new Logger('namespaces');
    logger.debug(`list / switch namespaces`);

    logger.startSpinner('Download namespaces');
    const current = await getCurrentNamespace();
    const namespaces = await getNamespaces();
    logger.stopSpinner();

    if (!args.name) {
      args.name = ((await prompt([
        {
          type: 'autocomplete',
          name: 'namespace',
          message: `Which namespace do you want to use? ${chalk.dim(
            `(current: ${current})`,
          )}`,
          source: async (_: any, input: string) => {
            if (!input) {
              return namespaces;
            }
            return fuzzy
              .filter(input.replace(/\s/g, ''), namespaces, {
                pre: '{',
                post: '}',
              })
              .map((e: any) => ({
                name: e.string.replace(/{(.)}/g, chalk.underline('$1')),
                value: e.original,
              }));
          },
        } as any,
      ])) as { namespace: string }).namespace;
    }

    if (current === args.name) {
      logger.info('No different namespace selected, exiting.');
      return;
    }

    if (!namespaces.includes(args.name)) {
      logger.error(`The namespace "${args.name}" does not exist.`);
      process.exit(ExitCode.error);
      return;
    }

    const context = await getCurrentContext();
    await exec(
      `kubectl config set-context "${context}" --namespace="${args.name}"`,
    );
    logger.info(`Active namespace is now "${chalk.yellow(args.name)}".`);
  },
};
