import chalk from 'chalk';
import { Command } from 'commander';

import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';
import { getVersionInfo } from '../../version';
import { getLocalVersions } from '../utils/kubectl';

export function registerList(subCommand: Command): void {
  subCommand
    .command('list')
    .alias('ls')
    .description('List local available kubectl versions.')
    .action(promiseAction(listLocalVersions));
}

async function listLocalVersions(): Promise<number> {
  console.group(chalk.underline('List kubectl installations'));

  const versions = await getLocalVersions();
  const { kubectlVersion } = await getVersionInfo();
  if (versions.length === 0) {
    console.log('No local installations found.');
    console.groupEnd();
    return ExitCode.success;
  }

  console.log('Local available kubectl versions:');
  versions.forEach(v =>
    console.log(
      `v${v} (~/.kube/k8s-helpers/kubectl/v${v})${
        v === kubectlVersion ? chalk.green(' selected') : ''
      }`,
    ),
  );

  console.groupEnd();
  return ExitCode.success;
}
