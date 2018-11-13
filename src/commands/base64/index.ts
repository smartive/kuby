import { Argv, CommandModule, showHelp } from 'yargs';

import { base64DecodeCommand } from './decode';
import { base64EncodeCommand } from './encode';

const base64Commands = [base64DecodeCommand, base64EncodeCommand];

export const base64Command: CommandModule = {
  command: 'base64',
  aliases: 'b64',
  describe: 'Utilities for base64 tranformations.',

  builder: (argv: Argv) =>
    base64Commands.reduce((_, cur) => argv.command(cur), argv),

  handler(): void {
    showHelp('log');
  },
};
