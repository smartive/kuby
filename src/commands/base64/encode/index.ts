import { write } from 'clipboardy';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../../root-arguments';
import { Logger } from '../../../utils/logger';

type Base64EncodeArguments = RootArguments & {
  content: string;
  noClip: boolean;
};

export const base64EncodeCommand: CommandModule<RootArguments, Base64EncodeArguments> = {
  command: 'encode <content>',
  aliases: 'enc',
  describe: 'Encode a defined content into the Base64 format.',

  builder: (argv: Argv<RootArguments>) =>
    (argv
      .positional('content', {
        type: 'string',
        description: 'The content that should be base64 encoded.',
      })
      .option('no-clip', {
        boolean: true,
        default: false,
        description: `Don't copy the resulting value into the clipboard.`,
      }) as unknown) as Argv<Base64EncodeArguments>,

  async handler(args: Arguments<Base64EncodeArguments>): Promise<void> {
    const logger = new Logger('base64');
    logger.debug('Encode string content.');

    const base64 = args.content.base64Encode();
    logger.output(base64);
    if (!args.noClip) {
      await write(base64);
    }
  },
};
