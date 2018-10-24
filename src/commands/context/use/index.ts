import chalk from 'chalk';
import { Command } from 'commander';
import { prompt } from 'inquirer';

import { exec } from '../../../utils/exec';
import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';
import { getContexts, getCurrentContext } from '../../context/utils/kubectx';

export function registerUse(subCommand: Command): void {
  subCommand.action(promiseAction(listOrSwitchContext));
}

export async function listOrSwitchContext(): Promise<number | null> {
  const args = process.argv.slice(3);

  if (args.length > 0) {
    return null;
  }

  console.group(chalk.underline(`List / Switch context`));

  const current = await getCurrentContext();
  const contexts = await getContexts();

  const { context } = (await prompt([
    {
      type: 'list',
      name: 'context',
      message: `Which context do you want to use?`,
      choices: contexts,
      default: current,
    },
  ])) as { context: string };

  if (current === context) {
    console.log('No different context selected, exiting.');
    console.groupEnd();
    return ExitCode.success;
  }

  await exec(`kubectl config use-context "${context}"`);
  console.log(`Active context is now "${chalk.yellow(context)}".`);
  console.groupEnd();

  return ExitCode.success;
}
