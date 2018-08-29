import chalk from 'chalk';
import { command } from 'commander';

import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';

command('*')
  .action(promiseAction(catchAll));

export async function catchAll(): Promise<number> {
  console.group(chalk.underline('Kätsch all'));
  console.log(arguments);
  return ExitCode.success;
}
