import { command } from 'commander';

import { registerInstall } from './install';
import { registerList } from './list';
import { registerRefresh } from './refresh';
import { registerUse } from './use';

const kubectl = command('kubectl')
  .description('Utilities for kubectl management.')
  .forwardSubcommands();

registerList(kubectl);
registerRefresh(kubectl);
registerInstall(kubectl);
registerUse(kubectl);
