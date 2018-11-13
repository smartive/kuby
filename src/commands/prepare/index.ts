import { async } from 'fast-glob';
import { emptyDir, outputFile, pathExists, readdir, readFile, stat } from 'fs-extra';
import { join, sep } from 'path';
import { Arguments, Argv, CommandModule } from 'yargs';

import { envsubst } from '../../utils/envsubst';
import { ExitCode } from '../../utils/exit-code';
import { Logger } from '../../utils/logger';

interface PrepareArguments extends Arguments {
  sourceFolder: string;
  destinationFolder: string;
}

interface PrepareCommandModule extends CommandModule {
  handler(args: PrepareArguments): Promise<void>;
}

export const prepareCommand: PrepareCommandModule = {
  command: 'prepare [sourceFolder] [destinationFolder]',
  describe: 'Prepare all found yaml files.',

  builder: (argv: Argv) =>
    argv
      .positional('sourceFolder', {
        description: 'Folder to search for yaml files.',
        type: 'string',
        default: './k8s/',
      })
      .positional('destinationFolder', {
        description: 'Folder to put prepared yaml files in.',
        type: 'string',
        default: './deployment/',
      })
      .completion('completion', false as any, async (_, argv: Arguments) => {
        if (argv._.length >= 4) {
          return [];
        }
        const dirs = [];
        const directory = await readdir(process.cwd());
        for (const path of directory) {
          const stats = await stat(path);
          if (stats.isDirectory()) {
            dirs.push(path);
          }
        }
        return dirs;
      }),

  async handler(args: PrepareArguments): Promise<void> {
    if (args.getYargsCompletions) {
      return;
    }

    const logger = new Logger('deployment');
    logger.debug('Prepare yaml files');

    args.sourceFolder = join(process.cwd(), args.sourceFolder);
    args.destinationFolder = join(process.cwd(), args.destinationFolder);

    if (!(await pathExists(args.sourceFolder))) {
      logger.error('Source directory does not exist. Aborting.');
      process.exit(ExitCode.error);
      return;
    }

    if (await pathExists(args.destinationFolder)) {
      logger.warn('Destination directory already exists, cleaning directory.');
    }

    await emptyDir(args.destinationFolder);

    const files = await async<string>(['**/*.{yml,yaml}'], {
      cwd: args.sourceFolder,
    });
    logger.debug(`Found ${files.length} files for processing.`);

    for (const file of files) {
      const destination = file.replace(new RegExp(sep, 'g'), '-');
      logger.debug(`Copy ${file} to ${destination} and replace env vars.`);

      const content = await readFile(join(args.sourceFolder, file), 'utf8');
      await outputFile(
        join(args.destinationFolder, destination),
        envsubst(content),
      );
    }

    logger.success('Files prepared.');
  },
};
