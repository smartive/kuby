import { exec as procExec } from 'child_process';

export function exec(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    procExec(command, (err, stdout, stderr) => {
      if (err || stderr) {
        reject(err || stderr);
        return;
      }
      resolve(stdout);
    });
  });
}
