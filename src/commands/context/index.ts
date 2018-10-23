import { command } from 'commander';

import { registerUse } from './use';

const kubectx = command('context')
  .alias('ctx')
  .description(
    'Utilities for kubernetes contexts. Without any subcommands, ' +
      'prints a list of possible configured contexts.',
  )
  .forwardSubcommands(false);

registerUse(kubectx);

kubectx
  .command('*')
  .description('No matching command found. Print help.')
  .action(() => kubectx.outputHelp());
