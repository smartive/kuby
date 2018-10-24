import chalk from 'chalk';
import { outputFile, pathExists } from 'fs-extra';
import { homedir } from 'os';
import { join } from 'path';
import { Arguments, Argv, CommandModule } from 'yargs';

import { ExitCode } from '../../utils/exit-code';
import { simpleConfirm } from '../../utils/simple-confirm';

const defaultEnv = 'KUBE_CONFIG';

interface KubeConfigArguments extends Arguments {
  configContent?: string;
  noInteraction: boolean;
}

interface KubeConfigCommandModule extends CommandModule {
  handler(args: KubeConfigArguments): Promise<void>;
}

function isBase64(content: string): boolean {
  return Buffer.from(content, 'base64').toString('base64') === content;
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
    console.group(chalk.underline('Set Kubernetes configuration'));
    if (!args.configContent && !process.env[defaultEnv]) {
      console.error(
        chalk.red('Neither env variable nor content provided. Aborting.'),
      );
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    const content = args.configContent || process.env[defaultEnv];

    if (!content) {
      console.error(chalk.red('Config content is empty. Aborting.'));
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    if (!isBase64(content)) {
      console.error(chalk.red('The content is not base64 encoded. Aborting.'));
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    const configPath = join(homedir(), '.kube', 'config');

    if (await pathExists(configPath)) {
      if (args.noInteraction) {
        console.log('Config already exists, exitting.');
        console.groupEnd();
        return;
      }

      if (
        !(await simpleConfirm(
          'The kube config (~/.kube/config) already exists. ' +
            'Do you want to overwrite it?',
          false,
        ))
      ) {
        console.groupEnd();
        return;
      }
    }

    console.log('Writing ~/.kube/config file.');
    await outputFile(configPath, Buffer.from(content, 'base64'));

    console.log(chalk.green('Login done.'));
    console.groupEnd();
  },
};
