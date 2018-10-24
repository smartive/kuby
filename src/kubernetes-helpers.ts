#!/usr/bin/env node
import { alias, command, help, option, parse, recommendCommands, scriptName, showHelp, strict, version } from 'yargs';

import { commands } from './commands';

scriptName('k8s');
version(false);

strict();
recommendCommands();

for (const cmd of commands) {
  command(cmd);
}

option('ci', {
  description: 'CI Mode (non-interactive and biased)',
  boolean: true,
  default: false,
  global: true,
});

alias('h', 'help');
help('help');
// wrap(terminalWidth());

if (parse()._.length === 0) {
  showHelp('log');
}
