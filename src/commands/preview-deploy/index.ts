import {
  V1Namespace,
  V1ObjectMeta,
  V1PolicyRule,
  V1Role,
  V1RoleBinding,
  V1RoleRef,
  V1ServiceAccount,
  V1Subject,
} from '@kubernetes/client-node';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../root-arguments';
import { ExitCode } from '../../utils/exit-code';
import { KubernetesApi } from '../../utils/kubernetes-api';
import { Logger } from '../../utils/logger';

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

async function createServiceAccount(api: KubernetesApi, namespace: string): Promise<void> {
  const name = 'deploy';
  try {
    await api.core.readNamespacedServiceAccount(name, namespace);
    logger.info('Service account already exists.');
  } catch (e) {
    if (e.response.statusCode !== 404) {
      throw e;
    }

    await api.core.createNamespacedServiceAccount(namespace, {
      ...new V1ServiceAccount(),
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        ...new V1ObjectMeta(),
        name,
      },
    });
    logger.success('Created service account "deploy".');
  }
}

async function createRole(api: KubernetesApi, namespace: string): Promise<void> {
  const name = 'deploy-role';
  try {
    await api.rbac.readNamespacedRole(name, namespace);
    logger.info('Role already exists.');
  } catch (e) {
    if (e.response.statusCode !== 404) {
      throw e;
    }

    await api.rbac.createNamespacedRole(namespace, {
      ...new V1Role(),
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'Role',
      metadata: {
        ...new V1ObjectMeta(),
        name,
      },
      rules: [
        {
          ...new V1PolicyRule(),
          verbs: ['*'],
          apiGroups: [
            '',
            'apps',
            'batch',
            'certmanager.k8s.io',
            'extensions',
            'rbac.authorization.k8s.io',
          ],
          resources: [
            'certificates',
            'cronjobs',
            'configmaps',
            'deployments',
            'ingresses',
            'jobs',
            'persistentvolumeclaims',
            'pods',
            'rolebindings',
            'roles',
            'secrets',
            'serviceaccounts',
            'services',
          ],
        },
      ],
    });
    logger.success('Created role "deploy-role".');
  }
}

async function createRoleBinding(api: KubernetesApi, namespace: string): Promise<void> {
  const name = 'deploy-role-binding';
  try {
    await api.rbac.readNamespacedRoleBinding(name, namespace);
    logger.info('RoleBinding already exists.');
  } catch (e) {
    if (e.response.statusCode !== 404) {
      throw e;
    }

    await api.rbac.createNamespacedRoleBinding(namespace, {
      ...new V1RoleBinding(),
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'RoleBinding',
      metadata: {
        ...new V1ObjectMeta(),
        name,
      },
      roleRef: {
        ...new V1RoleRef(),
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: 'deploy-role',
      },
      subjects: [
        {
          ...new V1Subject(),
          namespace,
          kind: 'ServiceAccount',
          name: 'deploy',
        },
      ],
    });
    logger.success('Created rolebinding "deploy-role-binding".');
  }
}

export const previewDeployCommand: CommandModule<RootArguments, PreviewDeployArguments> = {
  command: 'preview-deploy <name> [sourceFolder]',
  aliases: 'prev-dep',
  describe:
    'Create opinionated preview deployment. This command creates a namespace, ' +
    'the rolebindings in there and deploys the application in the given namespace.',

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

    const api = args.kubeConfig ?
      KubernetesApi.fromString(args.kubeConfig.isBase64() ? args.kubeConfig.base64Decode() : args.kubeConfig) :
      KubernetesApi.fromDefault();

    await createNamespace(api, name);
    await createServiceAccount(api, name);
    await createRole(api, name);
    await createRoleBinding(api, name);

    // await prepareCommand.handler(args);
    // await applyCommand.handler({
    //   ...args,
    //   deployFolder: args.destinationFolder,
    // });

    logger.success(`Preview Deployment applied to namespace "${name}".`);
  },
};
