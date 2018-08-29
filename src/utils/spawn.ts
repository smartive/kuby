import chalk from 'chalk';
import { spawn as procSpawn } from 'child_process';

export function spawn(command: string, args: string[] = [], nativeCommand: boolean = false): Promise<number> {
  console.group(chalk.blue(`Executing <${command} ${args.join(' ')}>`));
  console.log();

  return new Promise((resolve, reject) => {
    const child = procSpawn(
      command,
      args,
      {
        stdio: nativeCommand ? 'inherit' : 'pipe',
      },
    );

    if (!nativeCommand) {
      child.stderr.on(
        'data',
        data => console.error(`${chalk.red('[err]')}: ${data}`),
      );

      child.stdout.on(
        'data',
        data => console.log(`${chalk.cyan('[nfo]')}: ${data}`),
      );
    }

    child
      .on('error', (err) => {
        if (nativeCommand) {
          console.log();
        }
        console.groupEnd();
        reject(err);
      })
      .on('exit', (code) => {
        if (nativeCommand) {
          console.log();
        }
        console.groupEnd();
        resolve(code);
      });
  });
}
