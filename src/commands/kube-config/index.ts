import chalk from 'chalk';
import { outputFile, pathExists } from 'fs-extra';
import { homedir } from 'os';
import { join } from 'path';
import { Arguments, Argv, CommandModule } from 'yargs';

import { ExitCode } from '../../utils/exit-code';
import { Logger } from '../../utils/logger';
import { simpleConfirm } from '../../utils/simple-confirm';

const defaultEnv = 'KUBE_CONFIG';

interface KubeConfigArguments extends Arguments {
  configContent?: string;
  noInteraction: boolean;
}

interface KubeConfigCommandModule extends CommandModule {
  handler(args: KubeConfigArguments): Promise<void>;
}

export const kubeConfigCommand: KubeConfigCommandModule = {
  command: 'kube-config [configContent]',
  aliases: 'kc',
  describe:
    `Use the given kube-config content ${chalk.yellow('(base64 encoded)')} ` +
    `and create the ~/.kube/config file. If the content is omitted, the content ` +
    `of the env var "$KUBE_CONFIG" is used.`,

  builder: (argv: Argv) =>
    argv
      .positional('configContent', {
        description: 'Base64 encoded kube-config content.',
        type: 'string',
      })
      .option('n', {
        alias: 'no-interaction',
        boolean: true,
        default: false,
        description: 'No interaction mode, use default answers.',
      }),

  async handler(args: KubeConfigArguments): Promise<void> {
    const logger = new Logger('login config');
    logger.debug('Set Kubernetes configuration');

    if (!args.configContent && !process.env[defaultEnv]) {
      logger.error('Neither env variable nor content provided. Aborting.');
      process.exit(ExitCode.error);
      return;
    }

    const content = args.configContent || process.env[defaultEnv];

    if (!content) {
      logger.error('Config content is empty. Aborting.');
      process.exit(ExitCode.error);
      return;
    }

    if (!content.isBase64()) {
      logger.error('The content is not base64 encoded. Aborting.');
      process.exit(ExitCode.error);
      return;
    }

    const configPath = join(homedir(), '.kube', 'config');

    if (await pathExists(configPath)) {
      if (args.noInteraction) {
        logger.info('Config already exists, exitting.');
        return;
      }

      if (
        !(await simpleConfirm(
          'The kube config (~/.kube/config) already exists. ' +
            'Do you want to overwrite it?',
          false,
        ))
      ) {
        return;
      }
    }

    logger.info('Writing ~/.kube/config file.');
    await outputFile(configPath, content.base64Decode());

    logger.success('Login done.');
  },
};
