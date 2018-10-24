import chalk from 'chalk';
import { prompt } from 'inquirer';
import { EOL } from 'os';
import { Arguments, Argv, CommandModule } from 'yargs';

import { exec } from '../../../utils/exec';
import { ExitCode } from '../../../utils/exit-code';
import { getCurrentContext } from '../../context/utils/kubectx';
import { getCurrentNamespace, getNamespaces, getServiceAccountsForNamespace } from '../utils/kubens';

interface NamespaceKubeConfigArguments extends Arguments {
  namespace?: string;
  serviceAccount?: string;
  base64: boolean;
}

interface NamespaceKubeConfigCommandModule extends CommandModule {
  handler(args: NamespaceKubeConfigArguments): Promise<void>;
}

const kubeConfig = (
  server: string,
  certificate: string,
  namespace: string,
  saName: string,
  token: string,
) => `apiVersion: v1
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

export const namespaceKubeConfigCommand: NamespaceKubeConfigCommandModule = {
  command: 'kube-config [namespace] [serviceAccount]',
  aliases: 'kc',
  describe:
    'Generate a specific kube-config for the namespace and the given service account. If omitted, the user is asked.',

  builder: (argv: Argv) =>
    argv
      .positional('namespace', {
        description: 'Kubernetes namespace name.',
        type: 'string',
      })
      .positional('serviceAccount', {
        description: 'Kubernetes service account name.',
        type: 'string',
      })
      .option('b', {
        alias: 'base64',
        default: false,
        description: 'Output the kube-config encoded in base64.',
      }),

  async handler(args: NamespaceKubeConfigArguments): Promise<void> {
    console.group(chalk.underline('Create kube-config.'));

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
      console.error(
        chalk.red(`The namespace "${args.namespace}" does not exist.`),
      );
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    const serviceAccounts = await getServiceAccountsForNamespace(
      args.namespace,
    );

    if (!args.serviceAccount) {
      args.serviceAccount = ((await prompt([
        {
          type: 'list',
          name: 'sa',
          message: `Which serviceaccount in "${
            args.namespace
          }" do you want to generate the config for?`,
          choices: serviceAccounts,
        },
      ])) as { sa: string }).sa;
    }

    if (!serviceAccounts.includes(args.serviceAccount)) {
      console.error(
        chalk.red(
          `The service account "${
            args.serviceAccount
          }" does not exist in namespace "${args.namespace}".`,
        ),
      );
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    console.log(
      `Generate kube-config for account "${chalk.yellow(
        args.serviceAccount,
      )}" in namespace "${chalk.yellow(args.namespace)}".`,
    );

    try {
      const [tokenSecret] = (await exec(
        `kubectl get secrets -n ${
          args.namespace
        } -o=jsonpath='{range .items[*]}{@.metadata.name};{@.type}{"\\n"}{end}'`,
      ))
        .split('\n')
        .filter(Boolean)
        .map(line => line.split(';'))
        .filter(secret => secret[1].includes('service-account-token'))
        .find(secret => secret[0].startsWith(args.serviceAccount || '')) || [
          '',
        ];

      if (!tokenSecret) {
        throw new Error('No token secret found');
      }

      const base64Token = await exec(
        `kubectl get secret -n ${
          args.namespace
        } ${tokenSecret} -o=jsonpath='{@.data.token}'`,
      );

      const token = Buffer.from(base64Token, 'base64').toString('utf8');
      const currentContext = await getCurrentContext();
      const clusterName = await exec(
        `kubectl config view -o=jsonpath='{.contexts[?(@.name=="${currentContext}")].context.cluster}'`,
      );
      const [address, certificate] = (await exec(
        `kubectl config view --raw -o=jsonpath='{range .clusters[?(@.name=="${clusterName}")].cluster}` +
          `{@.server}||{@.certificate-authority-data}{end}'`,
      )).split('||');

      const config = kubeConfig(
        address,
        certificate,
        args.namespace,
        args.serviceAccount,
        token,
      );

      console.log(
        `Kube-Config for user "${chalk.yellow(
          args.serviceAccount,
        )}" on server "${chalk.yellow(address)}" in namespace "${chalk.yellow(
          args.namespace,
        )}":`,
      );
      if (args.base64) {
        console.log('(Config is Base64 encoded)');
      }
      process.stdout.write(
        `${EOL}${EOL}${
          args.base64 ? Buffer.from(config).toString('base64') : config
        }${EOL}${EOL}`,
      );

      console.log(chalk.green(`Kube-Config created.`));
      console.groupEnd();
    } catch (e) {
      console.error(chalk.red(`Error while fetching the config: ${e}`));
      console.groupEnd();
      process.exit(ExitCode.error);
    }
  },
};
