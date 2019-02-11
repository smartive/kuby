#!/usr/bin/env node
import './utils/extensions';

import chalk from 'chalk';
import { readFileSync } from 'fs-extra';
import yargonaut = require('yargonaut');
import {
  alias,
  Arguments,
  command,
  completion,
  config as yargsConfig,
  epilog,
  help,
  middleware,
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
import { KubernetesApi } from './utils/kubernetes-api';
import { Logger, LogLevel } from './utils/logger';

yargonaut.style('blue').errorsStyle('red.bold');

const findUp = require('find-up');

scriptName('kuby');
version(false);

strict();

middleware((args: Arguments<any>) => {
  args.logLevel = (LogLevel[args['logLevel']] as unknown) as LogLevel;
  Logger.level = args['logLevel'];
});

middleware((args: Arguments<any>) => {
  if (args.namespace) {
    KubernetesApi.namespaceOverride = args.namespace;
  }
  if (args.context) {
    KubernetesApi.contextOverride = args.context;
  }
});

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
option('context', {
  description: 'The context to run the given subcommand in',
  alias: 'ctx',
  string: true,
  global: true,
});
option('namespace', {
  description: 'The namespace to run the given subcommand in',
  alias: 'ns',
  string: true,
  global: true,
});
option('log-level', {
  alias: 'll',
  description: 'Loglevel of the tool.',
  choices: ['debug', 'info', 'warn', 'error'],
  default: 'info',
});

try {
  const configPath = findUp.sync(['.kubyrc', '.kubyrc.json']);
  const config = configPath ? JSON.parse(readFileSync(configPath, 'utf8')) : {};
  yargsConfig(config);
} catch {
  console.warn(chalk.yellow('The given config (.kubyrc / .kubyrc.json) could not be read.'));
  console.warn(chalk.yellow('Please ensure, it is a valid json file.'));
}

alias('h', 'help');
help('help');
wrap(terminalWidth());

epilog(chalk.dim(`This tool intends to help with everyday kubernetes administration.`));

const args = parse();
if (args._.length === 0 && !args.getYargsCompletions) {
  showHelp('log');
}
