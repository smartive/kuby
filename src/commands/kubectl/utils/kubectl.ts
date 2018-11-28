import {
  chmod,
  createWriteStream,
  emptyDir,
  ensureDir,
  lstatSync,
  pathExists,
  readdir,
  readJson,
  writeJson,
} from 'fs-extra';
import { get, stream } from 'got';
import { platform } from 'os';
import { posix } from 'path';
import { clean, rcompare } from 'semver';

import { Filepathes } from '../../../utils/filepathes';
import { Logger, LogLevel } from '../../../utils/logger';

const initialUrl =
  'https://api.github.com/repos/kubernetes/kubernetes/releases?per_page=100';

export async function downloadKubectl(
  version: string,
  logger: Logger = new Logger('download kubectl'),
): Promise<void> {
  logger.startSpinner(`Downloading v${version}.`, LogLevel.info);
  const url = kubectlDownloadUrl(version, getOs());
  const destination = posix.join(Filepathes.kubectlInstallPath, `v${version}`);
  const destinationFile = posix.join(
    destination,
    `kubectl${getOs() === 'windows' ? '.exe' : ''}`,
  );
  await emptyDir(destination);
  return new Promise<void>((resolve, reject) => {
    stream(url)
      .on('error', () => {
        logger.spinnerFail('Error during download.');
        reject();
      })
      .on('downloadProgress', progress =>
        logger.setSpinnerText(
          `Downloading v${version}. Progress: ${Math.round(
            progress.percent * 100,
          )}%`,
        ),
      )
      .on('end', () => {
        logger.spinnerSuccess(`Downloaded v${version}`);
        resolve();
      })
      .pipe(createWriteStream(destinationFile));
  }).then(() => chmod(destinationFile, '755'));
}

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
  await ensureDir(Filepathes.kubectlInstallPath);
  return ((await readdir(Filepathes.kubectlInstallPath))
    .filter(path =>
      lstatSync(posix.join(Filepathes.kubectlInstallPath, path)).isDirectory(),
    )
    .map(v => clean(v))
    .filter(Boolean) as string[]).sort(rcompare);
}

export async function downloadRemoteVersions(
  logger: Logger = new Logger('download remote kubetl versions'),
): Promise<string[]> {
  const versions: string[] = [];

  let getUrl: string | null = initialUrl;
  logger.startSpinner(`Downloading from: ${getUrl}`, LogLevel.info);
  while (getUrl) {
    logger.setSpinnerText(`Downloading from: ${getUrl}`);
    const result = await get(getUrl);

    versions.push(
      ...JSON.parse(result.body).map((release: any) => release.tag_name),
    );

    const { link } = result.headers;
    const match = /<(.*?)>; rel="next"/g.exec((link as any) || '');

    getUrl = match ? match[1] : null;
  }
  logger.spinnerSuccess('Versions downloaded');

  return versions.map(v => clean(v)).filter(Boolean) as string[];
}

export async function getRemoteVersions(
  logger: Logger = new Logger('get remote kubetl versions'),
): Promise<string[]> {
  if (await pathExists(Filepathes.kubectlVersionsPath)) {
    return await readJson(Filepathes.kubectlVersionsPath, { encoding: 'utf8' });
  }

  const versions = await downloadRemoteVersions(logger);
  await writeJson(Filepathes.kubectlVersionsPath, versions, {
    encoding: 'utf8',
  });

  return await readJson(Filepathes.kubectlVersionsPath, { encoding: 'utf8' });
}
