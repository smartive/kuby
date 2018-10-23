import chalk from 'chalk';
import { exec } from 'child_process';
import { command } from 'commander';

import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';

const { version } = require('../../../package.json');

/**
 * Version info for the tooling and the kubectl cli as well.
 * Does not contain the `v` in `kubectlVersion`.
 *
 * @export
 * @interface VersionInfo
 */
export interface VersionInfo {
  toolVersion: string;
  kubectlVersion: string;
  kubectlPlatform: string;
}

command('version')
  .description(
    'Output the program version and the version of kubectl that is used.',
  )
  .action(promiseAction(printVersion));

function getKubectlVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('kubectl version --client', (err, stdout, stderr) => {
      if (err || stderr) {
        reject(err || stderr);
        return;
      }
      resolve(stdout);
    });
  });
}

export async function getVersionInfo(): Promise<VersionInfo> {
  const kubectlVersion = await getKubectlVersion();
  const kubectlGitVersion = /GitVersion:"v(.*?)"/g.exec(kubectlVersion);
  const kubectlPlatform = /Platform:"(.*?)"/g.exec(kubectlVersion);

  const kubeVersion = kubectlGitVersion ? kubectlGitVersion[1] : 'unknown';
  const kubePlatform = kubectlPlatform ? kubectlPlatform[1] : 'unknown';

  return {
    kubectlPlatform: kubePlatform,
    kubectlVersion: kubeVersion,
    toolVersion: version,
  };
}

async function printVersion(): Promise<number> {
  console.group(chalk.underline('Print app version'));

  const {
    kubectlPlatform,
    toolVersion,
    kubectlVersion,
  } = await getVersionInfo();

  console.log(`k8s version: ${chalk.green(toolVersion)}`);

  console.log(
    `kubectl version: ${chalk.green(
      `v${kubectlVersion}`,
    )} for platform: ${chalk.green(kubectlPlatform)}`,
  );

  console.groupEnd();
  return ExitCode.success;
}
