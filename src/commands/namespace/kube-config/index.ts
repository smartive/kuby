import chalk from 'chalk';
import { Command } from 'commander';
import { prompt } from 'inquirer';
import { EOL } from 'os';

import { exec } from '../../../utils/exec';
import { ExitCode } from '../../../utils/exit-code';
import { promiseAction } from '../../../utils/promise-action';
import { getCurrentContext } from '../../context/utils/kubectx';
import { getCurrentNamespace, getNamespaces, getServiceAccountsForNamespace } from '../utils/kubens';

interface Options {
  base64?: boolean;
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

export function registerKubeConfig(subCommand: Command): void {
  subCommand
    .command('kube-config [namespace] [serviceAccount]')
    .alias('kc')
    .description(
      'Generate a specific kube-config for the namespace and the given service account. If omitted, the user is asked.',
    )
    // .option('-b, --base64', 'Output the kube-config encoded in base64.')
    .action(promiseAction(getKubeConfigForNamespace));
}

export async function getKubeConfigForNamespace(
  namespace: string | undefined,
  serviceAccount: string | undefined,
  options: Options,
): Promise<number> {
  console.group(chalk.underline('Create kube-config.'));

  let configNamespace = namespace;
  const currentNamespace = await getCurrentNamespace();
  const namespaces = await getNamespaces();

  if (!configNamespace) {
    configNamespace = ((await prompt([
      {
        type: 'list',
        name: 'namespace',
        message: `Which namespace do you want to generate the config for?`,
        choices: namespaces,
        default: currentNamespace,
      },
    ])) as { namespace: string }).namespace;
  }

  if (!namespaces.includes(configNamespace)) {
    console.error(
      chalk.red(`The namespace "${configNamespace}" does not exist.`),
    );
    console.groupEnd();
    return ExitCode.error;
  }

  let configServiceAccount = serviceAccount;
  const serviceAccounts = await getServiceAccountsForNamespace(configNamespace);

  if (!configServiceAccount) {
    configServiceAccount = ((await prompt([
      {
        type: 'list',
        name: 'sa',
        message: `Which serviceaccount in "${configNamespace}" do you want to generate the config for?`,
        choices: serviceAccounts,
      },
    ])) as { sa: string }).sa;
  }

  if (!serviceAccounts.includes(configServiceAccount)) {
    console.error(
      chalk.red(
        `The service account "${configServiceAccount}" does not exist in namespace "${configNamespace}".`,
      ),
    );
    console.groupEnd();
    return ExitCode.error;
  }

  console.log(
    `Generate kube-config for account "${chalk.yellow(
      configServiceAccount,
    )}" in namespace "${chalk.yellow(configNamespace)}".`,
  );

  try {
    const [tokenSecret] = (await exec(
      `kubectl get secrets -n ${configNamespace} -o=jsonpath='{range .items[*]}{@.metadata.name};{@.type}{"\\n"}{end}'`,
    ))
      .split('\n')
      .filter(Boolean)
      .map(line => line.split(';'))
      .filter(secret => secret[1].includes('service-account-token'))
      .find(secret => secret[0].startsWith(configServiceAccount || '')) || [''];

    if (!tokenSecret) {
      throw new Error('No token secret found');
    }

    const base64Token = await exec(
      `kubectl get secret -n ${configNamespace} ${tokenSecret} -o=jsonpath='{@.data.token}'`,
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
      configNamespace,
      configServiceAccount,
      token,
    );

    console.log(
      `Kube-Config for user "${chalk.yellow(
        configServiceAccount,
      )}" on server "${chalk.yellow(address)}" in namespace "${chalk.yellow(
        configNamespace,
      )}":`,
    );
    if (options.base64) {
      console.log('(Config is Base64 encoded)');
    }
    process.stdout.write(
      `${EOL}${EOL}${
        options.base64 ? Buffer.from(config).toString('base64') : config
      }${EOL}${EOL}`,
    );

    console.log(chalk.green(`Kube-Config created.`));
    console.groupEnd();
    return ExitCode.success;
  } catch (e) {
    console.error(chalk.red(`Error while fetching the token: ${e}`));
    console.groupEnd();
    return ExitCode.error;
  }
}
