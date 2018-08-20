import chalk from 'chalk';
import { spawn as procSpawn } from 'child_process';

export function spawn(command: string, args: string[] = []): Promise<number> {
  console.group(chalk.blue(`Executing <${command}>`));
  console.log();
  return new Promise((resolve, reject) => {
    const child = procSpawn(
      command,
      args,
    );

    child.stderr.on(
      'data',
      data => console.error(`${chalk.red('[err]')}: ${data}`),
    );

    child.stdout.on(
      'data',
      data => console.error(`${chalk.cyan('[nfo]')}: ${data}`),
    );

    child
      .on('error', (err) => {
        console.groupEnd();
        reject(err);
      })
      .on('exit', (code) => {
        console.groupEnd();
        resolve(code);
      });
  });
}
