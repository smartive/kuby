import { prompt } from 'inquirer';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../../root-arguments';
import { Logger } from '../../../utils/logger';
import { secretCreateCommand } from '../create';

const apacheMd5 = require('apache-md5');

type SecretBasicAuthArguments = RootArguments & {
  name: string;
  username?: string;
  password?: string;
};

export const secretBasicAuthCommand: CommandModule<RootArguments, SecretBasicAuthArguments> = {
  command: 'basic-auth <name> [username] [password]',
  aliases: 'ba',
  describe: 'Create a secret used for basic auth with an ingress.',

  builder: (argv: Argv<RootArguments>) =>
    argv
      .example(
        'kuby secret basic-auth my-secret user pass',
        'This creates an secret with the name my-secret, the user "user" and password "pass".',
      )
      .example(
        'kuby secret basic-auth my-secret user',
        'This creates an secret for basic auth and the password will be asked.',
      )
      .example(
        'kuby secret basic-auth my-secret',
        'This creates an secret for basic auth and both, the user and the password, will be asked.',
      )
      .positional('name', {
        description: 'Name of the secret to create',
        type: 'string',
      }) as Argv<SecretBasicAuthArguments>,

  async handler(args: Arguments<SecretBasicAuthArguments>): Promise<void> {
    const logger = new Logger('secrets');
    logger.debug('Create basic auth secret.');

    const answers = await prompt([
      {
        type: 'input',
        name: 'username',
        message: 'The username for basic auth?',
        when: () => !!!args.username,
        validate: (input: string) => !!input || 'Please enter a username.',
      },
      {
        type: 'password',
        name: 'password',
        message: 'The password for basic auth?',
        when: () => !!!args.password,
        validate: (input: string) => !!input || 'Please enter a password.',
      },
    ]);

    const basicAuthArguments = {
      ...args,
      ...answers,
    } as Arguments<SecretBasicAuthArguments> & Required<Pick<SecretBasicAuthArguments, 'username' | 'password'>>;

    logger.info(`Create basic auth secret for user "${basicAuthArguments.username}".`);

    await secretCreateCommand.handler({
      ...basicAuthArguments,
      data: [
        {
          name: 'auth',
          value: `${basicAuthArguments.username}:${apacheMd5(basicAuthArguments.password)}`,
        },
      ],
    });
  },
};
