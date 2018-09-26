import { ensureDir, lstatSync, pathExists, readdir, readJson, writeJson } from 'fs-extra';
import { get } from 'got';
import { homedir, platform } from 'os';
import { join } from 'path';
import { clean, rcompare } from 'semver';

const spinner = require('ora')();

const initialUrl =
  'https://api.github.com/repos/kubernetes/kubernetes/releases?per_page=100';

export const kubectlInstallDir = join(
  homedir(),
  '.kube',
  'k8s-helpers',
  'kubectl',
);

export const kubectlVersionsFile = join(
  homedir(),
  '.kube',
  'k8s-helpers',
  'kubectl',
  'versions',
);

export const kubectlDownloadUrl = (
  version: string,
  os: 'linux' | 'darwin' | 'windows',
) =>
  `https://storage.googleapis.com/kubernetes-release/release/v${version}/bin/${os}/amd64/kubectl${
    os === 'windows' ? '.exe' : ''
  }`;

export function getOs(): 'linux' | 'darwin' | 'windows' {
  switch (platform()) {
    case 'darwin':
      return 'darwin';
    case 'win32':
      return 'windows';
    default:
      return 'linux';
  }
}

export async function getLocalVersions(): Promise<string[]> {
  await ensureDir(kubectlInstallDir);
  return ((await readdir(kubectlInstallDir))
    .filter(path => lstatSync(join(kubectlInstallDir, path)).isDirectory())
    .map(v => clean(v))
    .filter(Boolean) as string[]).sort(rcompare);
}

export async function downloadRemoteVersions(): Promise<string[]> {
  const versions: string[] = [];

  let getUrl: string | null = initialUrl;
  spinner.start(`Downloading from: ${getUrl}`);
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
  spinner.succeed();

  return versions.map(v => clean(v)).filter(Boolean) as string[];
}

export async function getRemoteVersions(): Promise<string[]> {
  if (await pathExists(kubectlVersionsFile)) {
    return await readJson(kubectlVersionsFile, { encoding: 'utf8' });
  }

  const versions = await downloadRemoteVersions();
  await writeJson(kubectlVersionsFile, versions, { encoding: 'utf8' });

  return await readJson(kubectlVersionsFile, { encoding: 'utf8' });
}
