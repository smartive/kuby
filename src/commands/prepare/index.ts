import chalk from 'chalk';
import { command } from 'commander';
import { async } from 'fast-glob';
import { emptyDir, outputFile, pathExists, readFile } from 'fs-extra';
import { join, resolve, sep } from 'path';

import { envsubst } from '../../utils/envsubst';
import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';

command('prepare [baseFolder=./k8s/] [deployFolder=./deployment/]')
  .description('Prepare all found yaml files.')
  .action(promiseAction(prepare));

export async function prepare(
  baseFolder: string = './k8s/',
  deployFolder: string = './deployment/',
): Promise<number> {
  console.group(chalk.underline('Prepare yaml files'));

  const sourceFolder = resolve(process.cwd(), baseFolder);
  const destFolder = resolve(process.cwd(), deployFolder);

  if (!(await pathExists(sourceFolder))) {
    console.error(chalk.red('Source directory does not exist. Aborting.'));
    console.groupEnd();
    return ExitCode.error;
  }

  if (await pathExists(destFolder)) {
    console.warn(
      chalk.yellow('Destination directory already exists, cleaning directory.'),
    );
  }

  await emptyDir(destFolder);

  const files = await async<string>(['**/*.{yml,yaml}'], { cwd: sourceFolder });
  console.log(`Found ${files.length} files for processing.`);

  for (const file of files) {
    const destination = file.replace(new RegExp(sep, 'g'), '-');
    console.log(`Copy ${file} to ${destination} and replace env vars.`);

    const content = await readFile(join(sourceFolder, file), 'utf8');
    await outputFile(join(destFolder, destination), envsubst(content));
  }

  console.log(chalk.green('Files prepared.'));
  console.groupEnd();
  return ExitCode.success;
}
