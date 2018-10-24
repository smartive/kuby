import { command } from 'commander';

import { registerCreate } from './create';
import { registerUse } from './use';

const kubens = command('namespace')
  .alias('ns')
  .description(
    'Utilities for kubernetes namespaces. Without any subcommands, ' +
      'prints a list of possible namespaces in the current context.',
  )
  .forwardSubcommands(false);

registerCreate(kubens);
registerUse(kubens);

kubens
  .command('*')
  .description('No matching command found. Print help.')
  .action(() => kubens.outputHelp());
