import { Argv, CommandModule, showHelp } from 'yargs';

import { secretBasicAuthCommand } from './basic-auth';
import { secretCreateCommand } from './create';
import { secretDockerRegistryCommand } from './docker-registry';

const secretCommands: CommandModule<any, any>[] = [secretBasicAuthCommand, secretCreateCommand, secretDockerRegistryCommand];

export const secretCommand: CommandModule = {
  command: 'secret',
  describe: 'Utilities for kubernetes secrets.',

  builder: (argv: Argv) => secretCommands.reduce((_, cur) => argv.command(cur), argv),

  handler(): void {
    showHelp('log');
  },
};
