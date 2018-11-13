import { async } from 'fast-glob';
import { pathExists } from 'fs-extra';
import { prompt, Separator } from 'inquirer';
import { EOL } from 'os';
import { join, parse } from 'path';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../../../root-arguments';
import { Crypto } from '../../../../utils/crypto';
import { exec } from '../../../../utils/exec';
import { ExitCode } from '../../../../utils/exit-code';
import { Filepathes } from '../../../../utils/filepathes';
import { Logger } from '../../../../utils/logger';
import { RcFile } from '../../../../utils/rc-file';
import { simpleConfirm } from '../../../../utils/simple-confirm';
import { spawn } from '../../../../utils/spawn';

interface PromptAnswers {
  server: string;
  user: string;
  email: string;
  password: string;
  saveSecret?: boolean;
  saveSecretName?: string;
}

interface SecretDockerRegistryCreateArguments extends Arguments, RootArguments {
  name: string;
  noInteraction: boolean;
  from?: string;
  server?: string;
  user?: string;
  email?: string;
  password?: string;
}

async function loadDockerSecret(
  args: SecretDockerRegistryCreateArguments,
  path: string,
): Promise<void> {
  const secret = await Crypto.load<PromptAnswers>(path);
  args.server = secret.server;
  args.user = secret.user;
  args.email = secret.email;
  args.password = secret.password;
}

export const secretDockerRegistryCreateCommand: CommandModule = {
  command: 'create <name>',
  describe:
    `Create a docker registry secret with the name "<name>".${EOL}` +
    'For each option that is omitted, the user will be asked to enter the information.',

  builder: (argv: Argv) =>
    argv
      .example(
        'k8s secret docker-registry create test --server hub.docker.com --user myaccount --email foo@bar.ch --password asdf',
        'This command creates a dockerconfigjson secret for the server hub.docker.com with the given credentials.',
      )
      .example(
        'k8s secret docker-registry create test',
        'This command creates a dockerconfigjson secret named test, and the user will be asked for the other information.',
      )
      .positional('name', {
        description: 'The name of the secret.',
      })
      .option('n', {
        alias: 'no-interaction',
        boolean: true,
        default: false,
        description: 'No interaction mode, use options or throw error.',
      })
      .option('from', {
        string: true,
        description: 'Use an already saved dockersecret as template',
      })
      .option('server', {
        string: true,
        description: 'The docker registry server (e.g. hub.docker.com).',
      })
      .option('user', {
        string: true,
        description: 'Username of the docker user.',
      })
      .option('email', {
        string: true,
        description: 'Email for the given user.',
      })
      .option('password', {
        string: true,
        description: 'Password for the given user.',
      }),

  async handler(args: SecretDockerRegistryCreateArguments): Promise<void> {
    const logger = new Logger('secrets');
    logger.debug('Create docker secret.');

    const secrets = (await exec(
      `kubectl ${RcFile.getKubectlArguments(args, [
        'get',
        'secrets',
        '-o',
        `jsonpath='{range .items[*]}{@.metadata.name}{"\\n"}{end}'`,
      ]).join(' ')}`,
    )).split('\n');

    if (secrets.includes(args.name)) {
      logger.error(`The secret "${args.name}" already exists.`);
      if (args.ci) {
        logger.warn('CI Mode: existing secret does not fail command.');
        return;
      }
      process.exit(ExitCode.error);
      return;
    }

    if (args.from) {
      const path = join(Filepathes.dockerSecretPath, args.from);
      if (await pathExists(path)) {
        await loadDockerSecret(args, path);
      } else {
        logger.error(`The file ${path} does not exist. Cannot use template.`);
      }
    } else if (!!!args.from && !args.noInteraction) {
      const secretFiles = await async<string>(['./*'], {
        cwd: Filepathes.dockerSecretPath,
      });
      const selected = (await prompt([
        {
          type: 'list',
          name: 'file',
          message:
            'Use an existing secret as value template, or create a new one?',
          choices: [
            { value: 'new', name: 'create new' },
            new Separator(),
            ...secretFiles.map(file => ({
              value: file,
              name: parse(file).name,
            })),
          ],
        },
      ])) as { file: string };
      if (selected.file !== 'new') {
        const path = join(Filepathes.dockerSecretPath, selected.file);
        args.from = selected.file;
        await loadDockerSecret(args, path);
      }
    }

    if (
      args.noInteraction &&
      (!args.server || !args.user || !args.email || !args.password)
    ) {
      logger.error(
        'No interaction mode used but not all information present (server, user, mail, password).',
      );
      process.exit(ExitCode.error);
      return;
    }

    const questions = [
      {
        type: 'input',
        name: 'server',
        message: `The server url of the registry?`,
        when: () => !args.noInteraction && !!!args.server,
        validate: (input: string) => !!input || 'Please enter a server url.',
      },
      {
        type: 'input',
        name: 'user',
        message: `The user of the registry?`,
        when: () => !args.noInteraction && !!!args.user,
        validate: (input: string) => !!input || 'Please enter a username.',
      },
      {
        type: 'input',
        name: 'email',
        message: `The email of the registry user?`,
        when: () => !args.noInteraction && !!!args.email,
        validate: (input: string) => !!input || 'Please enter an email address.',
      },
      {
        type: 'password',
        name: 'password',
        message: `The password of the registry user?`,
        when: () => !args.noInteraction && !!!args.password,
        validate: (input: string) => !!input || 'Please enter a password.',
      },
      {
        type: 'confirm',
        name: 'saveSecret',
        message:
          'Save the given secret as template (encrypted, to be used with --from in the future)?',
        default: false,
        when: () => !args.noInteraction && !!!args.from,
      },
      {
        type: 'input',
        name: 'saveSecretName',
        message: 'Name of the file?',
        default: args.name,
        when: (answers: PromptAnswers) =>
          !args.noInteraction && !!!args.from && !!answers.saveSecret,
        validate: (input: string) => !!input || 'Please enter a filename.',
      },
    ];

    const createArgs = {
      ...args,
      ...((await prompt(questions)) as PromptAnswers),
    };

    const code = await spawn(
      'kubectl',
      RcFile.getKubectlArguments(args, [
        'create',
        'secret',
        'docker-registry',
        createArgs.name,
        `--docker-server=${createArgs.server}`,
        `--docker-username=${createArgs.user}`,
        `--docker-email=${createArgs.email}`,
        `--docker-password=${createArgs.password}`,
      ]),
    );
    if (code !== 0) {
      logger.error(
        'An error happend during the kubectl create secret command.',
      );
      process.exit(ExitCode.error);
      return;
    }

    logger.success(`Docker-Registry secret "${args.name}" created.`);

    if (createArgs.saveSecret) {
      const name = createArgs.saveSecretName || createArgs.name;
      const path = join(Filepathes.dockerSecretPath, name);
      if (
        (await pathExists(path)) &&
        !(await simpleConfirm(
          `Secret with name "${name}" already exists, overwrite?`,
          false,
        ))
      ) {
        return;
      }
      await Crypto.save(path, {
        server: createArgs.server,
        user: createArgs.user,
        email: createArgs.email,
        password: createArgs.password,
      });
      logger.success(`Secret saved under ${path}.`);
    }
  },
};
