import chalk from 'chalk';
import { Command } from 'commander';
import { remove, symlink } from 'fs-extra';
import { prompt } from 'inquirer';
import { platform } from 'os';
import { join } from 'path';
import { maxSatisfying } from 'semver';

import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';
import { getVersionInfo } from '../../version';
import { getLocalVersions, kubectlInstallDir } from '../utils/kubectl';

type PromptAnswers = {
  version: string;
};

export function registerUse(subCommand: Command): void {
  subCommand
    .command('use [semver]')
    .description('Use a specific version of kubectl (symlink it).')
    .action(promiseAction(useVersion));
}

export async function useVersion(version?: string): Promise<number> {
  console.group(chalk.underline(`Use kubectl version`));

  let useVer = version;
  const versions = await getLocalVersions();
  const { kubectlVersion } = await getVersionInfo();
  if (!useVer) {
    const answers = (await prompt([
      {
        type: 'list',
        name: 'version',
        message: `Which version do you want to use? (current: v${kubectlVersion})`,
        choices: [...versions.map(v => ({ value: v, name: `v${v}` }))],
      },
    ])) as PromptAnswers;
    useVer = answers.version;
  }

  const installVersion = maxSatisfying(versions, useVer);

  if (!installVersion) {
    console.error(
      chalk.red(
        'The given semver is not locally available. Use the install command.',
      ),
    );
    console.groupEnd();
    return ExitCode.error;
  }

  console.log(`Redirect the symlink to v${installVersion}.`);
  if (platform() !== 'win32') {
    await remove('/usr/local/bin/kubectl');
    await symlink(
      join(kubectlInstallDir, `v${installVersion}`, 'kubectl'),
      '/usr/local/bin/kubectl',
      'file',
    );
  }
  // TODO windows.

  console.log(chalk.green(`Version changed to v${installVersion}.`));
  console.groupEnd();
  return ExitCode.success;
}
