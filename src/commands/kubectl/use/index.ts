import chalk from 'chalk';
import { Command } from 'commander';
import { ensureDir, lstatSync, readdir, remove, symlink } from 'fs-extra';
import { prompt } from 'inquirer';
import { homedir, platform } from 'os';
import { join } from 'path';
import { clean, maxSatisfying } from 'semver';

import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';
import { getLocalVersions } from '../list';

type PromptAnswers = {
  version: string;
};

export function registerUse(subCommand: Command): void {
  subCommand
    .command('use [semver]')
    .description('Use a specific version of kubectl (symlink it).')
    .action(promiseAction(useVersion));
}

const installDir = join(homedir(), '.kube', 'k8s-helpers', 'kubectl');

export async function useVersion(version?: string): Promise<number> {
  console.group(chalk.underline(`Use kubectl version`));
  await ensureDir(installDir);

  let useVer = version;
  if (!useVer) {
    const answers = (await prompt([
      {
        type: 'list',
        name: 'version',
        message: 'Which version do you want to use?',
        choices: [
          ...(await getLocalVersions()).map(v => ({ value: v, name: `v${v}` })),
        ],
      },
    ])) as PromptAnswers;
    useVer = answers.version;
  }

  const versions = (await readdir(installDir))
    .filter(path => lstatSync(join(installDir, path)).isDirectory())
    .map(v => clean(v))
    .filter(Boolean) as string[];
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
      join(installDir, `v${installVersion}`, 'kubectl'),
      '/usr/local/bin/kubectl',
      'file',
    );
  }
  // TODO windows.

  console.log(chalk.green(`Version changed to v${installVersion}.`));
  console.groupEnd();
  return ExitCode.success;
}
