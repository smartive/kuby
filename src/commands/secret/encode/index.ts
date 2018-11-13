import { write } from 'clipboardy';
import { Arguments, Argv, CommandModule } from 'yargs';

import { Logger } from '../../../utils/logger';

interface SecretEncodeArguments extends Arguments {
  content: string;
  noClip: boolean;
}

export const secretEncodeCommand: CommandModule = {
  command: 'encode <content>',
  aliases: 'enc',
  describe: 'Encode a defined content into the Base64 format for k8s secrets.',

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

  async handler(args: SecretEncodeArguments): Promise<void> {
    const logger = new Logger('base64');
    logger.debug('Encode string content.');

    if (args.content.isBase64()) {
      logger.debug('Content is already base64 encoded.');
      logger.output(args.content);
      if (!args.noClip) {
        await write(args.content);
      }
      return;
    }

    const base64 = args.content.base64Encode();
    logger.output(base64);
    if (!args.noClip) {
      await write(base64);
    }
  },
};
