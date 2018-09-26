import chalk from 'chalk';
import { Command } from 'commander';
import { chmod, createWriteStream, emptyDir, ensureDir } from 'fs-extra';
import { stream } from 'got';
import { homedir, platform } from 'os';
import { join } from 'path';
import { maxSatisfying } from 'semver';

import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';
import { simpleConfirm } from '../../../utils/simple-confirm';
import { getVersions } from '../refresh';
import { useVersion } from '../use';

const spinner = require('ora')();

interface KubectlInstallOptions {
  interaction: boolean;
}

export function registerInstall(subCommand: Command): void {
  subCommand
    .command('install <semver>')
    .description(
      'Install and use a specific version of kubectl (i.e. download it).',
    )
    .option('-n, --no-interaction', 'No interaction mode, use default answers')
    .action(promiseAction(installVersion));
}

export const kubectlInstallDir = join(
  homedir(),
  '.kube',
  'k8s-helpers',
  'kubectl',
);
const downloadUrl = (version: string, os: 'linux' | 'darwin' | 'windows') =>
  `https://storage.googleapis.com/kubernetes-release/release/v${version}/bin/${os}/amd64/kubectl${
    os === 'windows' ? '.exe' : ''
  }`;

function getOs(): 'linux' | 'darwin' | 'windows' {
  switch (platform()) {
    case 'darwin':
      return 'darwin';
    case 'win32':
      return 'windows';
    default:
      return 'linux';
  }
}

async function download(version: string): Promise<void> {
  spinner.start(`Downloading v${version}.`);
  const url = downloadUrl(version, getOs());
  const destination = join(kubectlInstallDir, `v${version}`);
  const destinationFile = join(
    destination,
    `kubectl${getOs() === 'windows' ? '.exe' : ''}`,
  );
  await emptyDir(destination);
  return new Promise<void>((resolve, reject) => {
    stream(url)
      .on('error', () => {
        spinner.fail('Error during download.');
        reject();
      })
      .on(
        'downloadProgress',
        progress =>
          (spinner.text = `Downloading v${version}. Progress: ${Math.round(
            progress.percent * 100,
          )}%`),
      )
      .on('end', () => {
        spinner.succeed(`Downloaded v${version}`);
        resolve();
      })
      .pipe(createWriteStream(destinationFile));
  }).then(() => chmod(destinationFile, '755'));
}

async function installVersion(
  version: string,
  options: KubectlInstallOptions,
): Promise<number> {
  console.group(chalk.underline(`Install kubectl version`));
  await ensureDir(kubectlInstallDir);

  const versions = await getVersions();
  const installVersion = maxSatisfying(versions, version);

  if (!installVersion) {
    console.error(
      chalk.red(
        'The given semver is not available. Use other version or use the refresh command.',
      ),
    );
    console.groupEnd();
    return ExitCode.error;
  }
  if (
    options.interaction &&
    !(await simpleConfirm(
      `Found version v${installVersion}. Process install?`,
      true,
    ))
  ) {
    console.log('Aborting');
    console.groupEnd();
    return ExitCode.success;
  }

  await download(installVersion);
  await useVersion(installVersion);

  console.groupEnd();
  return ExitCode.success;
}
