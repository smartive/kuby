import { write } from 'clipboardy';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../../root-arguments';
import { Logger } from '../../../utils/logger';

type Base64DecodeArguments = RootArguments & {
  content: string;
  noClip: boolean;
};

export const base64DecodeCommand: CommandModule<RootArguments, Base64DecodeArguments> = {
  command: 'decode <content>',
  aliases: 'dec',
  describe: 'Decode a defined content from the Base64 format.',

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
      }) as unknown) as Argv<Base64DecodeArguments>,

  async handler(args: Arguments<Base64DecodeArguments>): Promise<void> {
    const logger = new Logger('base64');
    logger.debug('Decode base64 content.');

    const decoded = args.content.base64Decode();
    logger.output(decoded);
    if (!args.noClip) {
      await write(decoded);
    }
  },
};
