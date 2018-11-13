import chalk from 'chalk';
import { Argv, CommandModule } from 'yargs';

import { exec } from '../../utils/exec';
import { VersionInfo } from './version-info';

const { version } = require('../../../package.json');

export async function getVersionInfo(
  withRemote: boolean = false,
): Promise<VersionInfo> {
  const result: VersionInfo = {
    kubectlPlatform: 'unknown',
    kubectlVersion: 'unknown',
    toolVersion: version,
  };

  try {
    const kubectlVersion = await exec(
      `kubectl version${withRemote ? '' : ' --client'}`,
    );
    const kubectlGitVersion = /Client.*GitVersion:"v(.*?)"/g.exec(
      kubectlVersion,
    );
    const kubectlPlatform = /Client.*Platform:"(.*?)"/g.exec(kubectlVersion);

    result.kubectlVersion = kubectlGitVersion
      ? kubectlGitVersion[1]
      : 'unknown';
    result.kubectlPlatform = kubectlPlatform ? kubectlPlatform[1] : 'unknown';

    if (withRemote) {
      const remoteGitVersion = /Server.*GitVersion:"v(.*?)"/g.exec(
        kubectlVersion,
      );
      const remotePlatform = /Server.*Platform:"(.*?)"/g.exec(kubectlVersion);

      result.remoteVersion = remoteGitVersion ? remoteGitVersion[1] : 'unknown';
      result.remotePlatform = remotePlatform ? remotePlatform[1] : 'unknown';
    }
  } catch {}

  return result;
}

export const versionCommand: CommandModule = {
  command: 'version',
  describe:
    'Output the program version and the version of kubectl that is used.',

  builder: (argv: Argv) =>
    argv.option('remote', {
      alias: 'r',
      description:
        'Include (or at least try to) the version numeber of the remote server of the actual context.',
      boolean: true,
      default: false,
    }),

  async handler({ remote }: { remote: boolean }): Promise<void> {
    console.group(chalk.underline('Print app version'));
    const versionInfo = await getVersionInfo(remote);

    console.log(`k8s version: ${chalk.green(versionInfo.toolVersion)}`);

    console.log(
      `kubectl version: ${chalk.green(
        `v${versionInfo.kubectlVersion}`,
      )} for platform: ${chalk.green(versionInfo.kubectlPlatform)}`,
    );

    if (remote) {
      console.log(
        `kubernetes remote version: ${chalk.green(
          `v${versionInfo.remoteVersion}`,
        )} for platform: ${chalk.green(versionInfo.remotePlatform || '')}`,
      );
    }

    console.groupEnd();
  },
};
