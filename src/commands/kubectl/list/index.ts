import chalk from 'chalk';
import { Command } from 'commander';
import { ensureDir, lstatSync, readdir } from 'fs-extra';
import { homedir } from 'os';
import { join } from 'path';

import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';

export function registerList(subCommand: Command): void {
  subCommand
    .command('list')
    .alias('ls')
    .description('List local available kubectl versions.')
    .action(promiseAction(listLocalVersions));
}

const installDir = join(homedir(), '.kube', 'k8s-helpers', 'kubectl');

async function listLocalVersions(): Promise<number> {
  console.group(chalk.underline('List kubectl installations'));
  await ensureDir(installDir);

  const versions = (await readdir(installDir)).filter(path =>
    lstatSync(join(installDir, path)).isDirectory(),
  );
  console.log('Local available kubectl versions:');
  versions.forEach(v => console.log(`${v} (~/.kube/k8s-helpers/kubectl/${v})`));

  console.groupEnd();
  return ExitCode.success;
}
