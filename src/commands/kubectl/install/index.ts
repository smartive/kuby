import chalk from 'chalk';
import { chmod, createWriteStream, emptyDir, ensureDir } from 'fs-extra';
import { stream } from 'got';
import { join } from 'path';
import { maxSatisfying } from 'semver';
import { Arguments, Argv, argv, CommandModule } from 'yargs';

import { ExitCode } from '../../../utils/exit-code';
import { simpleConfirm } from '../../../utils/simple-confirm';
import { kubectlUseCommand } from '../use';
import { getLocalVersions, getOs, getRemoteVersions, kubectlDownloadUrl, kubectlInstallDir } from '../utils/kubectl';

interface KubectlInstallArguments extends Arguments {
  semver: string;
  noInteraction: boolean;
  force: boolean;
}

const ora = require('ora');

async function download(version: string): Promise<void> {
  const spinner = ora(`Downloading v${version}.`).start();
  const url = kubectlDownloadUrl(version, getOs());
  const destination = join(kubectlInstallDir, `v${version}`);
  const destinationFile = join(
    destination,
    `kubectl${getOs() === 'windows' ? '.exe' : ''}`,
  );
  await emptyDir(destination);
  return new Promise<void>((resolve, reject) => {
    stream(url)
      .on('error', () => {
        spinner.fail('Error during download.');
        reject();
      })
      .on(
        'downloadProgress',
        progress =>
          (spinner.text = `Downloading v${version}. Progress: ${Math.round(
            progress.percent * 100,
          )}%`),
      )
      .on('end', () => {
        spinner.succeed(`Downloaded v${version}`);
        resolve();
      })
      .pipe(createWriteStream(destinationFile));
  }).then(() => chmod(destinationFile, '755'));
}

export const kubectlInstallCommand: CommandModule = {
  command: 'install <semver>',
  describe: 'Install and use a specific version of kubectl (i.e. download it).',

  builder: (argv: Argv) =>
    argv
      .positional('semver', {
        description: 'Semver version of the kubectl version to install.',
        type: 'string',
        default: undefined,
      })
      .option('n', {
        alias: 'no-interaction',
        boolean: true,
        default: false,
        description: 'No interaction mode, use default answers.',
      })
      .option('f', {
        alias: 'force',
        boolean: true,
        default: false,
        description: 'Force re-install of a version if already installed.',
      }),
  // .fail((msg, err) => {
  //   if ('getYargsCompletions' in argv.argv) {
  //     console.log(argv.argv);
  //   }
  //   // console.log({
  //   //   foo: ,
  //   // });
  //   // if (err) throw err;
  //   // console.error('You broke it!');
  //   // console.error(msg);
  //   // console.error('You should be doing');
  //   process.exit(1);
  // })
  // .completion('completion', false as any, async (_, argv: Arguments) => {
  //   console.log('lol');
  //   return ['compl'];
  // }),

  async handler(args: KubectlInstallArguments): Promise<void> {
    if (args.getYargsCompletions) {
      return;
    }

    console.group(chalk.underline(`Install kubectl version`));
    await ensureDir(kubectlInstallDir);

    const versions = await getRemoteVersions();
    const installVersion = maxSatisfying(versions, args.semver);

    if (!installVersion) {
      console.error(
        chalk.red(
          'The given semver is not available. Use other version or use the refresh command.',
        ),
      );
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    if (!args.force && (await getLocalVersions()).includes(installVersion)) {
      console.log(
        `v${installVersion} already installed and no force flag set.`,
      );
      await kubectlUseCommand.handler(args);
      console.groupEnd();
      return;
    }

    if (
      !args.noInteraction &&
      !(await simpleConfirm(
        `Found version v${installVersion}. Process install?`,
        true,
      ))
    ) {
      console.log('Aborting');
      console.groupEnd();
      return;
    }

    await download(installVersion);
    await kubectlUseCommand.handler(args);

    console.groupEnd();
  },
};
