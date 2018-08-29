import chalk from 'chalk';
import { command } from 'commander';
import { pathExists } from 'fs-extra';

import { RootOptions } from '../../root-options';
import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';
import { spawn } from '../../utils/spawn';
import { kubeConfig } from '../kube-config';

command('apply [deployFolder=./deployment/]')
  .description('Apply all prepared yaml files with kubectl.')
  .action(promiseAction(apply));

interface ApplyOptions {
  parent: RootOptions;
}

export async function apply(
  deployFolder: string = './deployment/',
  options: ApplyOptions,
): Promise<number> {
  console.group(chalk.underline('Apply yaml files'));

  if (!await pathExists(deployFolder)) {
    console.error(chalk.red('Deploy directory does not exist. Aborting.'));
    console.groupEnd();
    return ExitCode.error;
  }

  if (options.parent.ci) {
    const loginCode = await kubeConfig(undefined, { interaction: false });
    if (loginCode !== 0) {
      console.error(chalk.red('An error happend during the kube config process.'));
      console.groupEnd();
      return ExitCode.error;
    }
  }

  const code = await spawn('kubectl', ['apply', '-f', deployFolder]);
  if (code !== 0) {
    console.error(chalk.red('An error happend during the kubectl command.'));
    console.groupEnd();
    return ExitCode.error;
  }

  console.log(chalk.green('Files applied.'));
  console.groupEnd();
  return ExitCode.success;
}
