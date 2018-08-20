import chalk from 'chalk';
import { command } from 'commander';
import { pathExists } from 'fs-extra';
import { prompt, Separator } from 'inquirer';
import klaw = require('klaw');
import { homedir } from 'os';
import { join, parse } from 'path';

import { loadMachineEncryptedJson, saveMachineEncryptedJson } from '../../utils/crypto';
import { ExitCode } from '../../utils/exit-code';
import { promiseAction } from '../../utils/promise-action';
import { simpleConfirm } from '../../utils/simple-confirm';
import { spawn } from '../../utils/spawn';

command('namespace <name>')
  .alias('ns')
  .description('Create a kubernetes namespace.')
  .action(promiseAction(namespace));

const answerCache = join(homedir(), '.kube', 'k8s-helpers', 'namespace', 'create-answers');

type PromptAnswers = {
  addDocker: boolean;
  dockerUser: string;
  dockerPass: string;
  dockerMail: string;
  dockerServer: string;
  secretName: string;
  addSecretToDefaultSa: boolean;
  saveAnswers: boolean;
  answerFileName: string;
};

function getAnswerFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const walker = klaw(dir);

  return new Promise((resolve, reject) => {
    walker
      .on('data', (item) => {
        if (/.*\.answers$/.test(item.path)) {
          files.push(item.path);
        }
      })
      .on('error', err => reject(err))
      .on('end', () => resolve(files));
  });
}

export async function namespace(name: string): Promise<number> {
  console.group(chalk.underline('Create k8s namespace'));

  const answerFileExists = await pathExists(answerCache);
  let cacheFile: string | undefined;

  if (answerFileExists) {
    const answerFiles = await getAnswerFiles(answerCache);
    if (answerFiles.length > 0) {
      const selected = await prompt([
        {
          type: 'list',
          name: 'file',
          message: 'Which answer file do you want to use?',
          choices: [
            ...answerFiles.map(file => ({ value: file, name: parse(file).name })),
            new Separator(),
            { value: 'new', name: 'create new' },
          ],
        },
      ]) as { file: string };
      if (selected.file !== 'new') {
        cacheFile = selected.file;
      }
    }
  }

  let answers: PromptAnswers;

  if (cacheFile) {
    answers = await loadMachineEncryptedJson<PromptAnswers>(cacheFile);
  } else {
    answers = await prompt([
      {
        type: 'confirm',
        name: 'addDocker',
        message: 'Add a docker config secret?',
        default: true,
      },
      {
        type: 'input',
        name: 'dockerUser',
        message: 'Docker username?',
        when: (answers: PromptAnswers) => answers.addDocker,
      },
      {
        type: 'password',
        name: 'dockerPass',
        message: 'Docker password?',
        when: (answers: PromptAnswers) => answers.addDocker,
      },
      {
        type: 'input',
        name: 'dockerMail',
        message: 'Docker email?',
        when: (answers: PromptAnswers) => answers.addDocker,
        validate: input => /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}/.test(input) || 'Please enter a valid email',
      },
      {
        type: 'input',
        name: 'dockerServer',
        message: 'Docker repository url?',
        when: (answers: PromptAnswers) => answers.addDocker,
        validate: input => /^https?:\/\//.test(input) || 'Enter a valid url',
      },
      {
        type: 'input',
        name: 'secretName',
        message: 'Kubernetes secret name?',
        default: 'docker-secret',
        when: (answers: PromptAnswers) => answers.addDocker,
      },
      {
        type: 'confirm',
        name: 'addSecretToDefaultSa',
        message: 'Add the secret to the default service account?',
        when: (answers: PromptAnswers) => answers.addDocker,
      },
      {
        type: 'confirm',
        name: 'saveAnswers',
        message: 'Save the given answers (encrypted)?',
        default: true,
      },
      {
        type: 'input',
        name: 'answerFileName',
        message: 'Answer file name?',
        when: (answers: PromptAnswers) => answers.saveAnswers,
        validate: input => !!input || 'Please enter a filename.',
      },
    ]) as PromptAnswers;

    if (answers.saveAnswers) {
      const file = join(answerCache, `${answers.answerFileName}.answers`);
      await saveMachineEncryptedJson(file, answers);
      console.log(`Answer file securely stored under: ${file}`);
    }
  }

  console.group('Summary');
  console.log(`Create namespace "${name}"`);
  if (answers.addDocker) {
    console.log(`Create docker secret "${answers.secretName}"`);
    console.log(`Docker user: ${answers.dockerUser}`);
    console.log(`Docker mail: ${answers.dockerMail}`);
    console.log(`Docker server: ${answers.dockerServer}`);
  }
  if (answers.addSecretToDefaultSa) {
    console.log('Add the secret to the default service account');
  }
  console.groupEnd();

  if (!await simpleConfirm('Do you want to proceed?', true)) {
    console.log('Abort due to users decision.');
    return ExitCode.success;
  }

  let code = 0;
  code = await await spawn('kubectl', ['create', 'ns', name]);
  if (code !== 0) {
    console.error(chalk.red('An error happend during the kubectl command.'));
    console.groupEnd();
    return ExitCode.error;
  }

  if (answers.addDocker) {
    code = await await spawn(
      'kubectl',
      [
        'create',
        'secret',
        'docker-registry',
        answers.secretName,
        `--docker-server=${answers.dockerServer}`,
        `--docker-username=${answers.dockerUser}`,
        `--docker-email=${answers.dockerMail}`,
        `--docker-password=${answers.dockerPass}`,
        `-n`,
        name,
      ],
    );
    if (code !== 0) {
      console.error(chalk.red('An error happend during the kubectl command.'));
      console.groupEnd();
      return ExitCode.error;
    }
  }

  if (answers.addSecretToDefaultSa) {
    code = await await spawn(
      'kubectl',
      [
        'patch',
        'serviceaccount',
        'default',
        '-p',
        `{"imagePullSecrets":[{"name": "${answers.secretName}"}]}`,
        `-n`,
        name,
      ],
    );
    if (code !== 0) {
      console.error(chalk.red('An error happend during the kubectl command.'));
      console.groupEnd();
      return ExitCode.error;
    }
  }

  console.log(chalk.green('Namespace created.'));
  console.groupEnd();
  return ExitCode.success;
}
