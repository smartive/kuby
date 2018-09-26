import { command } from 'commander';

import { registerInstall } from './install';
import { registerList } from './list';
import { registerRefresh } from './refresh';

const kubectl = command('kubectl')
  .description('Utilities for kubectl management.')
  .forwardSubcommands();

registerList(kubectl);
registerRefresh(kubectl);
registerInstall(kubectl);
