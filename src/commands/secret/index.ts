import { Argv, CommandModule, showHelp } from 'yargs';

import { secretDecodeCommand } from './decode';
import { secretDockerRegistryCommand } from './docker-registry';
import { secretEncodeCommand } from './encode';

const secretCommands = [
  secretDecodeCommand,
  secretDockerRegistryCommand,
  secretEncodeCommand,
];

export const secretCommand: CommandModule = {
  command: 'secret',
  aliases: 'sec',
  describe: 'Utilities for kubernetes secrets.',

  builder: (argv: Argv) =>
    secretCommands.reduce((_, cur) => argv.command(cur), argv),

  handler(): void {
    showHelp('log');
  },
};
