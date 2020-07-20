import * as chalk from 'chalk';
import { prompt } from 'inquirer';
import { EOL } from 'os';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../../root-arguments';
import { exec } from '../../../utils/exec';
import { ExitCode } from '../../../utils/exit-code';
import { Logger } from '../../../utils/logger';
import { getCurrentContext } from '../../context/utils/kubectx';
import { getCurrentNamespace, getNamespaces, getServiceAccountsForNamespace } from '../utils/kubens';

type NamespaceKubeConfigArguments = RootArguments & {
  namespace?: string;
  serviceAccount?: string;
  base64: boolean;
};

const kubeConfig = (server: string, certificate: string, namespace: string, saName: string, token: string) => `apiVersion: v1
kind: Config
clusters:
- cluster:
    server: ${server}
    certificate-authority-data: ${certificate}
  name: cluster
users:
- name: ${saName}
  user:
    token: ${token}
preferences: {}
contexts:
- context:
    cluster: cluster
    user: ${saName}
    namespace: ${namespace}
  name: cluster-context
current-context: cluster-context
`;

export async function generateKubeConfig(namespace: string, serviceAccount: string): Promise<string> {
  const [tokenSecret] = (await exec(
    `kubectl get secrets -n ${namespace} -o=jsonpath='{range .items[*]}{@.metadata.name};{@.type}{"\\n"}{end}'`,
  ))
    .split('\n')
    .filter(Boolean)
    .map(line => line.split(';'))
    .filter(secret => secret[1].includes('service-account-token'))
    .find(secret => secret[0].startsWith(serviceAccount || '')) || [''];

  if (!tokenSecret) {
    throw new Error('No token secret found');
  }

  const base64Token = await exec(`kubectl get secret -n ${namespace} ${tokenSecret} -o=jsonpath='{@.data.token}'`);

  const token = base64Token.base64Decode();
  const currentContext = await getCurrentContext();
  const clusterName = await exec(
    `kubectl config view -o=jsonpath='{.contexts[?(@.name=="${currentContext}")].context.cluster}'`,
  );
  const [address, certificate] = (await exec(
    `kubectl config view --raw -o=jsonpath='{range .clusters[?(@.name=="${clusterName}")].cluster}` +
      `{@.server}||{@.certificate-authority-data}{end}'`,
  )).split('||');

  return kubeConfig(address, certificate, namespace, serviceAccount, token);
}

export const namespaceKubeConfigCommand: CommandModule<RootArguments, NamespaceKubeConfigArguments> = {
  command: 'kube-config [namespace] [serviceAccount]',
  aliases: 'kc',
  describe:
    'Generate a specific kube-config for the namespace and the given service account. If omitted, the user is asked.',

  builder: (argv: Argv<RootArguments>) =>
    argv
      .positional('namespace', {
        description: 'Kubernetes namespace name.',
        type: 'string',
      })
      .positional('serviceAccount', {
        description: 'Kubernetes service account name.',
        type: 'string',
      })
      .option('base64', {
        alias: 'b',
        default: false,
        description: 'Output the kube-config encoded in base64.',
      })
      .completion('completion', false as any, async (current: string, argv: Arguments) => {
        switch (argv._.length) {
          case 3:
            return await getNamespaces();
          case 4:
            return await getServiceAccountsForNamespace(current);
          default:
            return [];
        }
      }),

  async handler(args: Arguments<NamespaceKubeConfigArguments>): Promise<void> {
    if (args.getYargsCompletions) {
      return;
    }

    const logger = new Logger('namespaces');
    logger.debug('Generate kube-config.');

    const currentNamespace = await getCurrentNamespace();
    const namespaces = await getNamespaces();

    if (!args.namespace) {
      args.namespace = ((await prompt([
        {
          type: 'list',
          name: 'namespace',
          message: `Which namespace do you want to generate the config for?`,
          choices: namespaces,
          default: currentNamespace,
        },
      ])) as { namespace: string }).namespace;
    }

    if (!namespaces.includes(args.namespace)) {
      logger.error(`The namespace "${args.namespace}" does not exist.`);
      process.exit(ExitCode.error);
      return;
    }

    const serviceAccounts = await getServiceAccountsForNamespace(args.namespace);

    if (!args.serviceAccount) {
      args.serviceAccount = ((await prompt([
        {
          type: 'list',
          name: 'sa',
          message: `Which serviceaccount in "${args.namespace}" do you want to generate the config for?`,
          choices: serviceAccounts,
        },
      ])) as { sa: string }).sa;
    }

    if (!serviceAccounts.includes(args.serviceAccount)) {
      logger.error(`The service account "${args.serviceAccount}" does not exist in namespace "${args.namespace}".`);
      process.exit(ExitCode.error);
      return;
    }

    logger.info(
      `Generate kube-config for account "${chalk.yellow(args.serviceAccount)}" in namespace "${chalk.yellow(
        args.namespace,
      )}".`,
    );

    try {
      const config = await generateKubeConfig(args.namespace, args.serviceAccount);

      logger.info(
        `Kube-Config for user "${chalk.yellow(args.serviceAccount)}" in namespace "${chalk.yellow(args.namespace)}":`,
      );
      if (args.base64) {
        logger.info('(Config is Base64 encoded)');
      }

      logger.output(`${EOL}${EOL}${args.base64 ? config.base64Encode() : config}${EOL}${EOL}`);

      logger.success(`Kube-Config created.`);
    } catch (e) {
      logger.error(`Error while fetching the config: ${e}`);
      process.exit(ExitCode.error);
    }
  },
};
