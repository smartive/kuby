import { command } from 'commander';

import { registerList } from './list';

const kubectl = command('kubectl')
  .description('Utilities for kubectl management.')
  .forwardSubcommands();

registerList(kubectl);
