import chalk from 'chalk';
import { command } from 'commander';

import { RootOptions } from '../../root-options';
import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';
import { apply } from '../apply';
import { prepare } from '../prepare';

command('deploy [baseFolder=./k8s/] [deployFolder=./deployment/]')
  .alias('dep')
  .description('Prepare all yaml files and execute an apply command on them.')
  .action(promiseAction(deploy));

interface DeployOptions {
  parent: RootOptions;
}

async function deploy(
  baseFolder: string = './k8s/',
  deployFolder: string = './deployment/',
  options: DeployOptions,
): Promise<number> {
  console.group(chalk.underline('Delete deployment'));

  const prepareCode = await prepare(baseFolder, deployFolder);
  if (prepareCode !== 0) {
    console.error(chalk.red('An error happend during the preparation.'));
    console.groupEnd();
    return ExitCode.error;
  }

  const applyCode = await apply(deployFolder, options);
  if (applyCode !== 0) {
    console.error(chalk.red('An error happend during the apply action.'));
    console.groupEnd();
    return ExitCode.error;
  }

  console.log(chalk.green('Deployments applied.'));
  console.groupEnd();
  return ExitCode.success;
}
