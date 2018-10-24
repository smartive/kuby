import chalk from 'chalk';
import { Command } from 'commander';
import { ensureFile, pathExists, readFile, writeFile } from 'fs-extra';
import { prompt } from 'inquirer';
import { EOL } from 'os';

import { datasubst } from '../../../utils/envsubst';
import { exec } from '../../../utils/exec';
import { ExitCode } from '../../../utils/exit-code';
import { Filepathes } from '../../../utils/filepathes';
import { promiseAction } from '../../../utils/promise-action';
import { simpleConfirm } from '../../../utils/simple-confirm';
import { spawn } from '../../../utils/spawn';
import { getCurrentContext } from '../../context/utils/kubectx';
import { getNamespaces } from '../utils/kubens';

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

interface PromptAnswers {
  createServiceAccount: boolean;
  serviceAccountName: string;
  role: string;
  saveRole: boolean;
}

export function registerCreate(subCommand: Command): void {
  subCommand
    .command('create <name>')
    .description('Create a new kubernetes namespace (with service account).')
    .action(promiseAction(createNamespace));
}

async function createNamespace(name: string): Promise<number> {
  console.group(chalk.underline('Create kubernetes namespace.'));

  const context = await getCurrentContext();
  const namespaces = await getNamespaces();

  if (namespaces.includes(name)) {
    console.error(chalk.red(`The namespace "${name}" already exists.`));
    console.groupEnd();
    return ExitCode.error;
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
      default: `${name}-deploy`,
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

  const answers = (await prompt(questions)) as PromptAnswers;

  if (answers.createServiceAccount && answers.role && answers.saveRole) {
    await ensureFile(Filepathes.namespaceDefaultRolePath);
    await writeFile(Filepathes.namespaceDefaultRolePath, answers.role);
    console.log(
      'The default role was saved under: ~/.kube/k8s-helpers/namespace/default-role.yml',
    );
    console.log('If you want to reset it, just delete the file.');
  }

  if (
    !(await simpleConfirm(
      `Create namespace "${chalk.yellow(name)}" on context "${chalk.yellow(
        context,
      )}"${
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
    return ExitCode.success;
  }

  const code = await spawn('kubectl', ['create', 'ns', name]);
  if (code !== 0) {
    console.error(
      chalk.red('An error happend during the kubectl create namespace command.'),
    );
    console.groupEnd();
    return ExitCode.error;
  }

  console.log(chalk.green(`Namespace "${name}" created.`));
  if (!answers.createServiceAccount) {
    console.groupEnd();
    return ExitCode.success;
  }

  const role = datasubst(answers.role, { NAME: name });
  const roleNameRegex = /^\s*name:\s*(.*)$/gm.exec(role);
  if (!roleNameRegex || !roleNameRegex[1]) {
    console.error(chalk.red('No valid role name provided. aborting.'));
    console.groupEnd();
    return ExitCode.error;
  }
  const roleName = roleNameRegex[1];

  const templates = [
    role,
    serviceAccount(name, answers.serviceAccountName),
    rolebinding(name, answers.serviceAccountName, roleName),
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

  // get kube-config

  console.groupEnd();
  return ExitCode.success;
}
