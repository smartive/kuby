import chalk from 'chalk';
import { Command } from 'commander';
import { ensureFile, pathExists, readJson, writeJson } from 'fs-extra';
import { get } from 'got';
import { homedir } from 'os';
import { join } from 'path';

import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';

const spinner = require('ora')();

export function registerRefresh(subCommand: Command): void {
  subCommand
    .command('refresh')
    .description(
      'Get all kubernetes releases from github api and store them locally.',
    )
    .action(promiseAction(refreshVersions));
}

const versionsFile = join(
  homedir(),
  '.kube',
  'k8s-helpers',
  'kubectl',
  'versions',
);

const initialUrl =
  'https://api.github.com/repos/kubernetes/kubernetes/releases?per_page=100';

async function getRemoteVersions(): Promise<string[]> {
  const versions: string[] = [];

  let getUrl: string | null = initialUrl;
  while (getUrl) {
    spinner.text = `Downloading from: ${getUrl}`;
    const result = await get(getUrl);

    versions.push(
      ...JSON.parse(result.body).map((release: any) => release.tag_name),
    );

    const { link } = result.headers;
    const match = /<(.*?)>; rel="next"/g.exec((link as any) || '');

    getUrl = match ? match[1] : null;
  }

  return versions.sort();
}

export async function refreshVersions(): Promise<number> {
  console.group(chalk.underline('Refresh online kubernetes release versions'));
  await ensureFile(versionsFile);
  spinner.start('Downloading versions');

  const versions = await getRemoteVersions();
  await writeJson(versionsFile, versions, { encoding: 'utf8' });

  spinner.succeed();

  console.log(chalk.green('Versions refreshed.'));
  console.groupEnd();
  return ExitCode.success;
}

export async function getVersions(): Promise<string[]> {
  if (await pathExists(versionsFile)) {
    return await readJson(versionsFile, { encoding: 'utf8' });
  }

  await refreshVersions();
  return await readJson(versionsFile, { encoding: 'utf8' });
}
