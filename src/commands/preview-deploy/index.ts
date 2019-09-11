import { V1Namespace, V1ObjectMeta } from '@kubernetes/client-node';
import * as fastGlob from 'fast-glob';
import { readFile } from 'fs-extra';
import { EOL } from 'os';
import { posix } from 'path';
import { Arguments, Argv, CommandModule } from 'yargs';
import { RootArguments } from '../../root-arguments';
import { envsubst } from '../../utils/envsubst';
import { exec } from '../../utils/exec';
import { ExitCode } from '../../utils/exit-code';
import { KubernetesApi } from '../../utils/kubernetes-api';
import { Logger } from '../../utils/logger';
import { kubeConfigCommand } from '../kube-config';

type PreviewDeployArguments = RootArguments & {
  name: string;
  sourceFolder: string;
  prefix: string;
  kubeConfig?: string;
};

const logger = new Logger('preview deployment');

async function createNamespace(api: KubernetesApi, name: string): Promise<void> {
  try {
    logger.info(`Create preview namespace "${name}".`);
    await api.core.readNamespace(name);
    logger.info(`Namespace "${name}" already exists.`);
  } catch (e) {
    if (e.response.statusCode !== 404) {
      throw e;
    }

    await api.core.createNamespace({
      ...new V1Namespace(),
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        ...new V1ObjectMeta(),
        name,
      },
    });
    logger.success(`Created namespace "${name}".`);
  }
}

export const previewDeployCommand: CommandModule<RootArguments, PreviewDeployArguments> = {
  command: 'preview-deploy <name> [sourceFolder]',
  aliases: 'prev-dep',
  describe:
    'Create opinionated preview deployment. This command creates a namespace ' +
    'and deploys the application in the given namespace.',

  builder: (argv: Argv<RootArguments>) =>
    argv
      .option('prefix', {
        string: true,
        description: 'Defines the prefix for the namespace name.',
        default: 'prev-',
      })
      .option('kube-config', {
        string: true,
        description: 'Define the kube config to use for namespace creation. Defaults to $KUBE_CONFIG variable.',
      })
      .positional('name', {
        description: 'Name of the preview namespace.',
        type: 'string',
      })
      .positional('sourceFolder', {
        description: 'Folder to search for yaml files.',
        type: 'string',
        default: './k8s/',
      }) as Argv<PreviewDeployArguments>,

  async handler(args: Arguments<PreviewDeployArguments>): Promise<void> {
    if (args.getYargsCompletions) {
      return;
    }

    logger.debug('Execute preview deployment');

    const name = `${args.prefix}${args.name}`;
    if (name.length > 64) {
      logger.error(`Name of the namespace "${name}" is too long (max: 64 characters, is: ${args.name.length})`);
      process.exit(ExitCode.error);
      return;
    }

    const api = args.kubeConfig
      ? KubernetesApi.fromString(args.kubeConfig.isBase64() ? args.kubeConfig.base64Decode() : args.kubeConfig)
      : KubernetesApi.fromDefault();

    await createNamespace(api, name);

    const files = await fastGlob(['**/*.{yml,yaml}'], {
      cwd: args.sourceFolder,
    });
    logger.debug(`Found ${files.length} files for processing.`);

    const yamls = (await Promise.all(files.map(async f => await readFile(posix.join(args.sourceFolder, f), 'utf8'))))
      .map(yaml => envsubst(yaml))
      .join(`${EOL}---${EOL}`);

    await kubeConfigCommand.handler({
      ...args,
      configContent: args.kubeConfig,
      noInteraction: true,
      force: args.ci,
    });

    logger.debug('Executing <echo "templates" | kubectl -n <name> apply -f ->');
    try {
      const result = await exec(`echo "${yamls}" | kubectl -n ${name} apply -f -`);
      logger.info(result);
    } catch (e) {
      logger.error(`Error: ${e}`);
      process.exit(ExitCode.error);
      return;
    }

    logger.success(`Preview Deployment applied to namespace "${name}".`);
  },
};
