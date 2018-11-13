import { write } from 'clipboardy';
import { Arguments, Argv, CommandModule } from 'yargs';

import { Logger } from '../../../utils/logger';

interface SecretDecodeArguments extends Arguments {
  content: string;
  noClip: boolean;
}

export const secretDecodeCommand: CommandModule = {
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

  async handler(args: SecretDecodeArguments): Promise<void> {
    const logger = new Logger('base64');
    logger.debug('Decode base64 content.');

    if (!args.content.isBase64()) {
      logger.debug('Content is not base64 encoded.');
      logger.output(args.content);
      if (!args.noClip) {
        await write(args.content);
      }
      return;
    }

    const decoded = args.content.base64Decode();
    logger.output(decoded);
    if (!args.noClip) {
      await write(decoded);
    }
  },
};
