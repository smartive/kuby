import chalk from 'chalk';
import { command, outputHelp } from 'commander';

import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';

command('*')
  .description('No matching command found. Print help.')
  .action(promiseAction(catchAll));

export async function catchAll(): Promise<number> {
  console.log(chalk.yellow('No matching command found.'));
  outputHelp();
  return ExitCode.success;
}
