import { write } from 'clipboardy';
import { Arguments, Argv, CommandModule } from 'yargs';

import { Logger } from '../../../utils/logger';

interface Base64DecodeArguments extends Arguments {
  content: string;
  noClip: boolean;
}

export const base64DecodeCommand: CommandModule = {
  command: 'decode <content>',
  aliases: 'dec',
  describe: 'Decode a defined content from the Base64 format.',

  builder: (argv: Argv) =>
    argv
      .positional('content', {
        type: 'string',
        description: 'The content that should be base64 encoded.',
      })
      .option('no-clip', {
        boolean: true,
        default: false,
        description: `Don't copy the resulting value into the clipboard.`,
      }),

  async handler(args: Base64DecodeArguments): Promise<void> {
    const logger = new Logger('base64');
    logger.debug('Decode base64 content.');

    const decoded = args.content.base64Decode();
    logger.output(decoded);
    if (!args.noClip) {
      await write(decoded);
    }
  },
};
