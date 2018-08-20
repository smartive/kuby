import chalk from 'chalk';
import { command } from 'commander';
import { outputFile, pathExists } from 'fs-extra';
import { homedir } from 'os';
import { join } from 'path';

import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';
import { simpleConfirm } from '../../utils/simple-confirm';

command('kube-config [configContent]')
  .alias('kc')
  .description(
    `Use the given kube-config content ${chalk.yellow('(base64 encoded)')} ` +
    `and create the ~/.kube/config file. If the content is omitted, the content ` +
    `of the env var "$KUBE_CONFIG" is used.`,
  )
  .option('-n, --no-interaction', 'No interaction mode, use default answers')
  .action(promiseAction(login));

const defaultEnv = 'KUBE_CONFIG';

interface LoginOptions {
  interaction: boolean;
}

function isBase64(content: string): boolean {
  return Buffer.from(content, 'base64').toString('base64') === content;
}

export async function login(configContent: string | undefined, options: LoginOptions): Promise<number> {
  console.group(chalk.underline('Kubernetes configuration'));
  if (!configContent && !process.env[defaultEnv]) {
    console.error(chalk.red('Neither env variable nor content provided. Aborting.'));
    console.groupEnd();
    return ExitCode.error;
  }

  const content = configContent || process.env[defaultEnv];

  if (!content) {
    console.error(chalk.red('Config content is empty. Aborting.'));
    console.groupEnd();
    return ExitCode.error;
  }

  if (!isBase64(content)) {
    console.error(chalk.red('The content is not base64 encoded. Aborting.'));
    console.groupEnd();
    return ExitCode.error;
  }

  const configPath = join(homedir(), '.kube', 'config');

  if (await pathExists(configPath)) {
    if (!options.interaction) {
      console.log('Config already exists, exitting.');
      return ExitCode.success;
    }

    if (!await simpleConfirm(
      'The kube config (~/.kube/config) already exists. ' +
      'Do you want to overwrite it?',
      false,
    )) {
      return ExitCode.success;
    }
  }

  console.log('Writing ~/.kube/config file.');
  await outputFile(configPath, Buffer.from(content, 'base64'));

  console.log(chalk.green('Login done.'));
  console.groupEnd();
  return ExitCode.success;
}
