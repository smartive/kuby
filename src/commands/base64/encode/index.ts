import { write } from 'clipboardy';
import { Arguments, Argv, CommandModule } from 'yargs';

import { Logger } from '../../../utils/logger';

interface Base64EncodeArguments extends Arguments {
  content: string;
  noClip: boolean;
}

export const base64EncodeCommand: CommandModule = {
  command: 'encode <content>',
  aliases: 'enc',
  describe: 'Encode a defined content into the Base64 format.',

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

  async handler(args: Base64EncodeArguments): Promise<void> {
    const logger = new Logger('base64');
    logger.debug('Encode string content.');

    const base64 = args.content.base64Encode();
    logger.output(base64);
    if (!args.noClip) {
      await write(base64);
    }
  },
};
