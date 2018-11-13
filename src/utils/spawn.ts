import { spawn as procSpawn } from 'child_process';

import { Logger } from './logger';

export function spawn(command: string, args: string[] = []): Promise<number> {
  const logger = new Logger(`exec ${command}`);

  return new Promise((resolve, reject) => {
    const child = procSpawn(command, args, {
      stdio: 'pipe',
    });

    child.stderr.on('data', logger.error.bind(logger));
    child.stdout.on('data', logger.info.bind(logger));

    child.on('error', err => reject(err)).on('exit', code => resolve(code));
  });
}
