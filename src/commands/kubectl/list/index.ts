import chalk from 'chalk';
import { Command } from 'commander';
import { ensureDir, lstatSync, readdir } from 'fs-extra';
import { join } from 'path';
import { clean, rcompare } from 'semver';

import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';
import { kubectlInstallDir } from '../install';

export function registerList(subCommand: Command): void {
  subCommand
    .command('list')
    .alias('ls')
    .description('List local available kubectl versions.')
    .action(promiseAction(listLocalVersions));
}

export async function getLocalVersions(): Promise<string[]> {
  return ((await readdir(kubectlInstallDir))
    .filter(path => lstatSync(join(kubectlInstallDir, path)).isDirectory())
    .map(v => clean(v))
    .filter(Boolean) as string[]).sort(rcompare);
}

async function listLocalVersions(): Promise<number> {
  console.group(chalk.underline('List kubectl installations'));
  await ensureDir(kubectlInstallDir);

  const versions = await getLocalVersions();
  if (versions.length === 0) {
    console.log('No local installations found.');
    console.groupEnd();
    return ExitCode.success;
  }

  console.log('Local available kubectl versions:');
  versions.forEach(v =>
    console.log(`v${v} (~/.kube/k8s-helpers/kubectl/v${v})`),
  );

  console.groupEnd();
  return ExitCode.success;
}
