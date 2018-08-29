#!/usr/bin/env node
import './utils/commander-extensions';

import './commands';

import chalk from 'chalk';
import { description, name, option, outputHelp, parse, version as programVersion } from 'commander';

const { version } = require('../package.json');

programVersion(version);
name('k8s');
description(`${chalk.blue('smartive AG')} kubernetes (k8s) helper commands.`);
option('--ci', 'CI mode, perform a kube-config login with the content of $KUBE_CONFIG and no interaction flag.');

parse(process.argv);

if (!process.argv.slice(2).length) {
  outputHelp();
}
