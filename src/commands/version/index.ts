import chalk from 'chalk';
import { exec } from 'child_process';
import { command } from 'commander';

import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';

const { version } = require('../../../package.json');

command('version')
  .description(
    'Output the program version and the version of kubectl that is used.',
  )
  .action(promiseAction(printVersion));

function getKubectlVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('kubectl version --client', (err, stdout, stderr) => {
      if (err || stderr) {
        reject(err || stderr);
        return;
      }
      resolve(stdout);
    });
  });
}

async function printVersion(): Promise<number> {
  console.group(chalk.underline('Print app version'));

  console.log(`k8s version: ${chalk.green(version)}`);

  const kubectlVersion = await getKubectlVersion();
  const kubectlGitVersion = /GitVersion:"(.*?)"/g.exec(kubectlVersion);
  const kubectlPlatform = /Platform:"(.*?)"/g.exec(kubectlVersion);

  if (!kubectlGitVersion) {
    console.error(chalk.red('An error happend during the preparation.'));
    console.groupEnd();
    return ExitCode.error;
  }

  const platform = kubectlPlatform ? kubectlPlatform[1] : 'unknown';

  console.log(
    `kubectl version: ${chalk.green(
      kubectlGitVersion[1],
    )} for platform: ${chalk.green(platform)}`,
  );

  console.groupEnd();
  return ExitCode.success;
}
