import * as chalk from 'chalk';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../root-arguments';
import { exec } from '../../utils/exec';
import { Logger } from '../../utils/logger';
import { VersionInfo } from './version-info';

const { version } = require('../../../package.json');

export async function getVersionInfo(withRemote: boolean = false): Promise<VersionInfo> {
  const result: VersionInfo = {
    kubectlPlatform: 'unknown',
    kubectlVersion: 'unknown',
    toolVersion: version,
  };

  try {
    const kubectlVersion = await exec(`kubectl version${withRemote ? '' : ' --client'}`);
    const kubectlGitVersion = /Client.*GitVersion:"v(.*?)"/g.exec(kubectlVersion);
    const kubectlPlatform = /Client.*Platform:"(.*?)"/g.exec(kubectlVersion);

    result.kubectlVersion = kubectlGitVersion ? kubectlGitVersion[1] : 'unknown';
    result.kubectlPlatform = kubectlPlatform ? kubectlPlatform[1] : 'unknown';

    if (withRemote) {
      const remoteGitVersion = /Server.*GitVersion:"v(.*?)"/g.exec(kubectlVersion);
      const remotePlatform = /Server.*Platform:"(.*?)"/g.exec(kubectlVersion);

      result.remoteVersion = remoteGitVersion ? remoteGitVersion[1] : 'unknown';
      result.remotePlatform = remotePlatform ? remotePlatform[1] : 'unknown';
    }
  } catch {}

  return result;
}

export const versionCommand: CommandModule<RootArguments, { remote: boolean }> = {
  command: 'version',
  describe: 'Output the program version and the version of kubectl that is used.',

  builder: (argv: Argv) =>
    argv.option('remote', {
      alias: 'r',
      description: 'Include (or at least try to) the version numeber of the remote server of the actual context.',
      boolean: true,
      default: false,
    }),

  async handler({ remote }: Arguments<{ remote: boolean }>): Promise<void> {
    const logger = new Logger('version');
    logger.debug('Print app version');

    const versionInfo = await getVersionInfo(remote);

    logger.info(`kuby version: ${chalk.green(versionInfo.toolVersion)}`);

    logger.info(
      `kubectl version: ${chalk.green(`v${versionInfo.kubectlVersion}`)} for platform: ${chalk.green(
        versionInfo.kubectlPlatform,
      )}`,
    );

    if (remote) {
      logger.info(
        `kubernetes remote version: ${chalk.green(`v${versionInfo.remoteVersion}`)} for platform: ${chalk.green(
          versionInfo.remotePlatform || '',
        )}`,
      );
    }
  },
};
