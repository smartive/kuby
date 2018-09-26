import chalk from 'chalk';
import { Command } from 'commander';
import { remove } from 'fs-extra';
import { prompt } from 'inquirer';
import { platform } from 'os';
import { join } from 'path';
import { maxSatisfying } from 'semver';

import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';
import { getLocalVersions, kubectlInstallDir } from '../utils/kubectl';

type PromptAnswers = {
  version: string;
};

export function registerRemove(subCommand: Command): void {
  subCommand
    .command('remove [semver]')
    .alias('rm')
    .description('Delete (locally) a version of kubectl.')
    .action(promiseAction(removeVersion));
}

export async function removeVersion(version?: string): Promise<number> {
  console.group(chalk.underline(`Delete kubectl version`));

  let useVer = version;
  if (!useVer) {
    const answers = (await prompt([
      {
        type: 'list',
        name: 'version',
        message: 'Which version do you want to delete?',
        choices: [
          ...(await getLocalVersions()).map(v => ({ value: v, name: `v${v}` })),
        ],
      },
    ])) as PromptAnswers;
    useVer = answers.version;
  }

  const versions = await getLocalVersions();
  const installVersion = maxSatisfying(versions, useVer);

  if (!installVersion) {
    console.log('The given semver is not locally installed.');
    console.groupEnd();
    return ExitCode.success;
  }

  console.log('Delete folder.');
  await remove(join(kubectlInstallDir, `v${installVersion}`));

  console.log('Delete symlink.');
  if (platform() !== 'win32') {
    await remove('/usr/local/bin/kubectl');
  }
  // TODO windows.

  console.log(chalk.green(`Version v${installVersion} removed.`));
  console.groupEnd();
  return ExitCode.success;
}
