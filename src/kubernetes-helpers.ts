#!/usr/bin/env node
import {
  alias,
  command,
  completion,
  help,
  option,
  parse,
  scriptName,
  showHelp,
  strict,
  terminalWidth,
  version,
  wrap,
} from 'yargs';

import { commands } from './commands';

scriptName('k8s');
version(false);

strict();

for (const cmd of commands) {
  command(cmd);
}

completion();

option('ci', {
  description: 'CI Mode (non-interactive and biased)',
  boolean: true,
  default: false,
  global: true,
});

alias('h', 'help');
help('help');
wrap(terminalWidth());

const args = parse();
if (args._.length === 0 && !args.getYargsCompletions) {
  showHelp('log');
}
