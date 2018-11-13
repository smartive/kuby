import { Argv, CommandModule, showHelp } from 'yargs';

import { kubectlInstallCommand } from './install';
import { kubectlListCommand } from './list';
import { kubectlRefreshCommand } from './refresh';
import { kubectlRemoveCommand } from './remove';
import { kubectlUseCommand } from './use';

const kubectlCommands = [
  kubectlInstallCommand,
  kubectlListCommand,
  kubectlRefreshCommand,
  kubectlRemoveCommand,
  kubectlUseCommand,
];

export const kubectlCommand: CommandModule = {
  command: 'kubectl',
  describe: 'Utilities for kubectl management.',

  builder: (argv: Argv) =>
    kubectlCommands.reduce((_, cur) => argv.command(cur), argv),

  handler(): void {
    showHelp('log');
  },
};
