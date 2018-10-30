import chalk from 'chalk';
import { ensureFile, pathExists, readFile, writeFile } from 'fs-extra';
import { prompt } from 'inquirer';
import { EOL } from 'os';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../../root-arguments';
import { datasubst } from '../../../utils/envsubst';
import { exec } from '../../../utils/exec';
import { ExitCode } from '../../../utils/exit-code';
import { Filepathes } from '../../../utils/filepathes';
import { RcFile } from '../../../utils/rc-file';
import { simpleConfirm } from '../../../utils/simple-confirm';
import { spawn } from '../../../utils/spawn';
import { getCurrentContext } from '../../context/utils/kubectx';
import { namespaceKubeConfigCommand } from '../kube-config';
import { getNamespaces } from '../utils/kubens';

interface NamespaceCreateArguments extends Arguments, RootArguments {
  name: string;
  base64: boolean;
  noInteraction: boolean;
}

interface PromptAnswers {
  createServiceAccount: boolean;
  serviceAccountName: string;
  role: string;
  saveRole: boolean;
}

const serviceAccount = (namespace: string, saName: string) => `apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${saName}
  namespace: ${namespace}
`;

const rolebinding = (
  namespace: string,
  saName: string,
  roleName: string,
) => `apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ${saName}
  namespace: ${namespace}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ${roleName}
subjects:
- kind: ServiceAccount
  name: ${saName}
  namespace: ${namespace}
`;

const defaultRoleYml = `# possible variables: NAME (name of the namespace)
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: Role
metadata:
  name: $\{NAME\}-deploy
  namespace: $\{NAME\}
rules:
  - apiGroups:
      - ''
      - apps
      - batch
      - certmanager.k8s.io
      - extensions
    resources:
      - certificates
      - cronjobs
      - configmaps
      - deployments
      - ingresses
      - jobs
      - persistentvolumeclaims
      - pods
      - secrets
      - services
    verbs:
      - '*'
`;

export const namespaceCreateCommand: CommandModule = {
  command: 'create <name>',
  describe:
    'Create a new kubernetes namespace (with optional service account and kubeconfig).',

  builder: (argv: Argv) =>
    argv
      .positional('name', {
        description: 'Kubernetes namespace name.',
        type: 'string',
      })
      .option('b', {
        alias: 'base64',
        default: false,
        description: 'Output the kube-config encoded in base64.',
      })
      .option('n', {
        alias: 'no-interaction',
        boolean: true,
        default: false,
        description: 'No interaction mode, use default answers.',
      }),

  async handler(args: NamespaceCreateArguments): Promise<void> {
    console.group(chalk.underline('Create kubernetes namespace.'));

    const context = await getCurrentContext();
    const namespaces = await getNamespaces();

    if (namespaces.includes(args.name)) {
      console.error(chalk.red(`The namespace "${args.name}" already exists.`));
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    const defaultRole = (await pathExists(Filepathes.namespaceDefaultRolePath))
      ? await readFile(Filepathes.namespaceDefaultRolePath, 'utf8')
      : defaultRoleYml;

    const questions = [
      {
        type: 'confirm',
        name: 'createServiceAccount',
        message: 'Create a service account?',
        default: true,
      },
      {
        type: 'input',
        name: 'serviceAccountName',
        message: `The name of the service account?`,
        default: `${args.name}-deploy`,
        when: (answers: PromptAnswers) => answers.createServiceAccount,
        validate: (input: string) => !!input || 'Please enter a name.',
      },
      {
        type: 'editor',
        name: 'role',
        message: 'Edit the role for the service account.',
        default: defaultRole,
        when: (answers: PromptAnswers) => answers.createServiceAccount,
      },
      {
        type: 'confirm',
        name: 'saveRole',
        message: 'Save the given role as new default?',
        default: false,
        when: (answers: PromptAnswers) => answers.createServiceAccount,
      },
    ];

    const answers = (args.noInteraction
      ? {
        createServiceAccount: true,
        serviceAccountName: `${args.name}-deploy`,
        role: defaultRole,
        saveRole: false,
      }
      : await prompt(questions)) as PromptAnswers;

    if (answers.createServiceAccount && answers.role && answers.saveRole) {
      await ensureFile(Filepathes.namespaceDefaultRolePath);
      await writeFile(Filepathes.namespaceDefaultRolePath, answers.role);
      console.log(
        'The default role was saved under: ~/.kube/k8s-helpers/namespace/default-role.yml',
      );
      console.log('If you want to reset it, just delete the file.');
    }

    if (
      !args.noInteraction &&
      !(await simpleConfirm(
        `Create namespace "${chalk.yellow(
          args.name,
        )}" on context "${chalk.yellow(context)}"${
          answers.createServiceAccount
            ? `, with service account "${chalk.yellow(
                answers.serviceAccountName,
              )}"`
            : ''
        }. Proceed?`,
        true,
      ))
    ) {
      console.log('Aborting');
      console.groupEnd();
      return;
    }

    const code = await spawn(
      'kubectl',
      RcFile.getKubectlCtxArguments(args, ['create', 'ns', args.name]),
    );
    if (code !== 0) {
      console.error(
        chalk.red(
          'An error happend during the kubectl create namespace command.',
        ),
      );
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }

    console.log(chalk.green(`Namespace "${args.name}" created.`));
    if (!answers.createServiceAccount) {
      console.groupEnd();
      return;
    }

    const role = datasubst(answers.role, { NAME: args.name });
    const roleNameRegex = /^\s*name:\s*(.*)$/gm.exec(role);
    if (!roleNameRegex || !roleNameRegex[1]) {
      console.error(chalk.red('No valid role name provided. aborting.'));
      console.groupEnd();
      process.exit(ExitCode.error);
      return;
    }
    const roleName = roleNameRegex[1];

    const templates = [
      role,
      serviceAccount(args.name, answers.serviceAccountName),
      rolebinding(args.name, answers.serviceAccountName, roleName),
    ];

    console.group(
      chalk.blue(`Executing <echo "templates" | kubectl create -f ->`),
    );

    try {
      const result = await exec(
        `echo "${templates.join(`${EOL}---${EOL}`)}" | kubectl create -f -`,
      );
      console.log(result);
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
    }
    console.groupEnd();

    console.log(
      chalk.green(`ServiceAccount "${answers.serviceAccountName}" created.`),
    );
    console.log(chalk.green(`Role and RoleBinding "${roleName}" created.`));

    await namespaceKubeConfigCommand.handler({
      ...args,
      namespace: args.name,
      serviceAccount: answers.serviceAccountName,
    });

    console.groupEnd();
  },
};
