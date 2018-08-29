import chalk from 'chalk';
import { spawn as procSpawn } from 'child_process';

export function spawn(command: string, args: string[] = [], nativeCommand: boolean = false): Promise<number> {
  console.group(chalk.blue(`Executing <${command} ${args.join(' ')}>`));
  console.log();

  const errLog = nativeCommand ?
    (data: Buffer) => data.toString().trim() && process.stderr.write(data) :
    (data: Buffer) => console.error(`${chalk.red('[err]')}: ${data}`);

  const nfoLog = nativeCommand ?
    (data: Buffer) => data.toString().trim() && process.stdout.write(data) :
    (data: Buffer) => console.log(`${chalk.cyan('[nfo]')}: ${data}`);

  return new Promise((resolve, reject) => {
    const child = procSpawn(
      command,
      args,
    );

    child.stderr.on(
      'data',
      errLog,
    );

    child.stdout.on(
      'data',
      nfoLog,
    );

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
