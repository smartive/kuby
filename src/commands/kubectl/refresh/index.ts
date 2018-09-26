import chalk from 'chalk';
import { Command } from 'commander';
import { ensureFile, writeJson } from 'fs-extra';

import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';
import { downloadRemoteVersions, kubectlVersionsFile } from '../utils/kubectl';

export function registerRefresh(subCommand: Command): void {
  subCommand
    .command('refresh')
    .description(
      'Get all kubernetes releases from github api and store them locally.',
    )
    .action(promiseAction(refreshVersions));
}

export async function refreshVersions(): Promise<number> {
  console.group(chalk.underline('Refresh online kubernetes release versions'));
  await ensureFile(kubectlVersionsFile);

  const versions = await downloadRemoteVersions();
  await writeJson(kubectlVersionsFile, versions, { encoding: 'utf8' });

  console.log(chalk.green('Versions refreshed.'));
  console.groupEnd();
  return ExitCode.success;
}
