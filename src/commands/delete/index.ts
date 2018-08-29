import chalk from 'chalk';
import { command } from 'commander';

import { RootOptions } from '../../root-options';
import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';
import { spawn } from '../../utils/spawn';
import { kubeConfig } from '../kube-config';
import { prepare } from '../prepare';

command('delete [baseFolder=./k8s/] [deployFolder=./deployment/]')
  .alias('del')
  .description('Prepare all yaml files and execute a DELETE command on them.')
  .action(promiseAction(deleteDeployment));

interface DeleteOptions {
  parent: RootOptions;
}

async function deleteDeployment(
  baseFolder: string = './k8s/',
  deployFolder: string = './deployment/',
  options: DeleteOptions,
): Promise<number> {
  console.group(chalk.underline('Delete deployment'));

  const prepareCode = await prepare(baseFolder, deployFolder);
  if (prepareCode !== 0) {
    console.error(chalk.red('An error happend during the preparation.'));
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

  const code = await spawn('kubectl', ['delete', '-f', deployFolder]);
  if (code !== 0) {
    console.error(chalk.red('An error happend during the kubectl command.'));
    console.groupEnd();
    return ExitCode.error;
  }

  console.log(chalk.green('Deployments deleted.'));
  console.groupEnd();
  return ExitCode.success;
}
