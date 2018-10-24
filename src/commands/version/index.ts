import chalk from 'chalk';
import { CommandModule } from 'yargs';

import { exec } from '../../utils/exec';
import { VersionInfo } from './version-info';

const { version } = require('../../../package.json');

export async function getVersionInfo(): Promise<VersionInfo> {
  let kubeVersion = 'unknown';
  let kubePlatform = 'unknown';

  try {
    const kubectlVersion = await exec('kubectl version --client');
    const kubectlGitVersion = /GitVersion:"v(.*?)"/g.exec(kubectlVersion);
    const kubectlPlatform = /Platform:"(.*?)"/g.exec(kubectlVersion);

    kubeVersion = kubectlGitVersion ? kubectlGitVersion[1] : 'unknown';
    kubePlatform = kubectlPlatform ? kubectlPlatform[1] : 'unknown';
  } catch {}

  return {
    kubectlPlatform: kubePlatform,
    kubectlVersion: kubeVersion,
    toolVersion: version,
  };
}

export const versionCommand: CommandModule = {
  command: 'version',
  describe:
    'Output the program version and the version of kubectl that is used.',

  async handler(): Promise<void> {
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
  },
};
