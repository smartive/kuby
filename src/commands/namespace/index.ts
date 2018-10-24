import chalk from 'chalk';
import { prompt } from 'inquirer';
import { Arguments, Argv, CommandModule } from 'yargs';

import { exec } from '../../utils/exec';
import { ExitCode } from '../../utils/exit-code';
import { getCurrentContext } from '../context/utils/kubectx';
import { namespaceCreateCommand } from './create';
import { namespaceKubeConfigCommand } from './kube-config';
import { getCurrentNamespace, getNamespaces } from './utils/kubens';

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
    argv.positional('name', {
      description: 'Namespace to switch to. If omitted, user is asked.',
      type: 'string',
    });
    return namespaceCommands.reduce((_, cur) => argv.command(cur), argv);
  },

  async handler(args: NamespaceArguments): Promise<void> {
    console.group(chalk.underline(`List / Switch namespaces`));

    const current = await getCurrentNamespace();
    const namespaces = await getNamespaces();

    if (!args.name) {
      args.name = ((await prompt([
        {
          type: 'list',
          name: 'namespace',
          message: `Which namespace do you want to use?`,
          choices: namespaces,
          default: current,
        },
      ])) as { namespace: string }).namespace;
    }

    if (current === args.name) {
      console.log('No different namespace selected, exiting.');
      console.groupEnd();
      return;
    }

    if (!namespaces.includes(args.name)) {
      console.error(chalk.red(`The namespace "${args.name}" does not exist.`));
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    const context = await getCurrentContext();
    await exec(
      `kubectl config set-context "${context}" --namespace="${args.name}"`,
    );
    console.log(`Active namespace is now "${chalk.yellow(args.name)}".`);
    console.groupEnd();
  },
};
