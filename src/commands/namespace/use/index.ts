import chalk from 'chalk';
import { Command } from 'commander';
import { prompt } from 'inquirer';

import { exec } from '../../../utils/exec';
import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';
import { getCurrentContext } from '../../context/utils/kubectx';
import { getCurrentNamespace, getNamespaces } from '../utils/kubens';

export function registerUse(subCommand: Command): void {
  subCommand.action(promiseAction(listOrSwitchNamespace));
}

export async function listOrSwitchNamespace(): Promise<number> {
  const args = process.argv.slice(3);

  if (args.length > 0) {
    return ExitCode.success;
  }

  console.group(chalk.underline(`List / Switch namespaces`));

  const current = await getCurrentNamespace();
  const namespaces = await getNamespaces();

  const { namespace } = (await prompt([
    {
      type: 'list',
      name: 'namespace',
      message: `Which namespace do you want to use?`,
      choices: namespaces,
      default: current,
    },
  ])) as { namespace: string };

  if (current === namespace) {
    console.log('No different namespace selected, exiting.');
    console.groupEnd();
    return ExitCode.success;
  }

  const context = await getCurrentContext();
  await exec(
    `kubectl config set-context "${context}" --namespace="${namespace}"`,
  );
  console.log(`Active namespace is now "${chalk.yellow(namespace)}".`);
  console.groupEnd();

  return ExitCode.success;
}
