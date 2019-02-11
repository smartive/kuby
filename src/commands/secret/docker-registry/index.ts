import { Argv, CommandModule, showHelp } from 'yargs';

import { secretDockerRegistryCreateCommand } from './create';

const secretDockerRegistryCommands: CommandModule<any, any>[] = [secretDockerRegistryCreateCommand];

export const secretDockerRegistryCommand: CommandModule = {
  command: 'docker-registry',
  describe: 'Utilities for kubernetes docker registry secrets.',

  builder: (argv: Argv) => secretDockerRegistryCommands.reduce((_, cur) => argv.command(cur), argv),

  handler(): void {
    showHelp('log');
  },
};
