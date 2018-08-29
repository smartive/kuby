import chalk from 'chalk';
import { command } from 'commander';

import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';
import { spawn } from '../../utils/spawn';

command('*')
  .description(`Catch all command. Forwards everything to ${chalk.yellow('kubectl')}.`)
  .action(promiseAction(catchAll));

export async function catchAll(...args: any[]): Promise<number> {
  console.group(chalk.underline('Catch all'));
  args.pop();
  console.log(`Forwarding ${args.length} arguments to kubectl.`);
  const code = await spawn('kubectl', args, true);
  if (code !== 0) {
    console.error(chalk.red('An error happend during the kubectl command.'));
    console.groupEnd();
    return ExitCode.error;
  }
  console.log(chalk.green('Command executed.'));
  console.groupEnd();
  return ExitCode.success;
}
