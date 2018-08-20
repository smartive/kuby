import chalk from 'chalk';
import { command } from 'commander';
import { emptyDir, outputFile, pathExists, readFile } from 'fs-extra';
import klaw = require('klaw');
import { join, relative, sep } from 'path';

import { envsubst } from '../../utils/envsubst';
import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';

command('prepare [baseFolder=./k8s/] [deployFolder=./deployment/]')
  .description('Prepare all found yaml files.')
  .action(promiseAction(prepare));

function getYamls(dir: string): Promise<string[]> {
  const files: string[] = [];
  const walker = klaw(dir);

  return new Promise((resolve, reject) => {
    walker
      .on('data', (item) => {
        if (/.*\.ya?ml$/.test(item.path)) {
          files.push(item.path);
        }
      })
      .on('error', err => reject(err))
      .on('end', () => resolve(files));
  });
}

export async function prepare(
  baseFolder: string = './k8s/',
  deployFolder: string = './deployment/',
): Promise<number> {
  console.group(chalk.underline('Prepare yaml files'));

  if (!await pathExists(baseFolder)) {
    console.error(chalk.red('Source directory does not exist. Aborting.'));
    console.groupEnd();
    return ExitCode.error;
  }

  if (await pathExists(deployFolder)) {
    console.warn(chalk.yellow('Destination directory already exists, cleaning directory.'));
  }

  await emptyDir(deployFolder);

  const files = await getYamls(baseFolder);
  console.log(`Found ${files.length} files for processing.`);

  for (const file of files) {
    const source = relative(baseFolder, file);
    const destination = source.replace(new RegExp(sep, 'g'), '-');
    console.log(`Copy ${source} to ${destination} and replace env vars.`);

    const content = await readFile(file, 'utf8');
    await outputFile(join(deployFolder, destination), envsubst(content));
  }

  console.log(chalk.green('Files prepared.'));
  console.groupEnd();
  return ExitCode.success;
}
