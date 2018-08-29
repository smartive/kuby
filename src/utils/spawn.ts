import chalk from 'chalk';
import { spawn as procSpawn } from 'child_process';

export function spawn(command: string, args: string[] = [], nativeCommand: boolean = false): Promise<number> {
  console.group(chalk.blue(`Executing <${command} ${args.join(' ')}>`));
  console.log();

  const errLog = nativeCommand ?
    (data: any) => process.stderr.write(data) :
    (data: any) => console.error(`${chalk.red('[err]')}: ${data}`);

  const nfoLog = nativeCommand ?
    (data: any) => process.stdout.write(data) :
    (data: any) => console.log(`${chalk.cyan('[nfo]')}: ${data}`);

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
