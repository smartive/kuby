import { command } from 'commander';

import { registerUse } from './use';

const kubens = command('namespace')
  .alias('ns')
  .description(
    'Utilities for kubernetes namespaces. Without any subcommands, ' +
      'prints a list of possible namespaces in the current context.',
  )
  .forwardSubcommands(false);

// registerList(kubens);
// registerRefresh(kubens);
// registerInstall(kubens);
// registerUse(kubens);
// registerRemove(kubens);

registerUse(kubens);

// kubens
//   .command('create')
//   .description('new')
//   .action(() => console.log('new'));
// kubens
//   .command('')
//   .description('list')
//   .action(() => console.log('list / switch'));

kubens
  .command('*')
  .description('No matching command found. Print help.')
  .action(() => kubens.outputHelp());
