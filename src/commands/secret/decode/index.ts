import chalk from 'chalk';
import { write } from 'clipboardy';
import { Arguments, Argv, CommandModule } from 'yargs';

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
    console.group(chalk.underline('Decode secret'));

    if (!args.content.isBase64()) {
      console.log('Content is not base64 encoded.');
      if (!args.noClip) {
        await write(args.content);
      }
      console.groupEnd();
      return;
    }

    const decoded = args.content.base64Decode();

    console.log(decoded);
    if (!args.noClip) {
      await write(decoded);
    }

    console.groupEnd();
  },
};
