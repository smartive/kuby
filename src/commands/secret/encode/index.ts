import chalk from 'chalk';
import { write } from 'clipboardy';
import { Arguments, Argv, CommandModule } from 'yargs';

interface SecretEncodeArguments extends Arguments {
  content: string;
  noClip: boolean;
}

export const secretEncodeCommand: CommandModule = {
  command: 'encode <content>',
  aliases: 'en',
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
    console.group(chalk.underline('Encode secret'));

    if (args.content.isBase64()) {
      console.log('Content is already base64 encoded.');
      if (!args.noClip) {
        await write(args.content);
      }
      console.groupEnd();
      return;
    }

    const base64 = args.content.base64Encode();

    console.log(base64);
    if (!args.noClip) {
      await write(base64);
    }

    console.groupEnd();
  },
};
