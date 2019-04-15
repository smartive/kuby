import { dumpYaml, V1ObjectMeta, V1Secret } from '@kubernetes/client-node';
import { Arguments, Argv, CommandModule } from 'yargs';

import { RootArguments } from '../../../root-arguments';
import { ExitCode } from '../../../utils/exit-code';
import { KubernetesApi } from '../../../utils/kubernetes-api';
import { Logger } from '../../../utils/logger';

type SecretCreateArguments = RootArguments & {
  name: string;
  dryRun: boolean;

  /**
   * Array of already splitted and converted data for the secret.
   */
  data: { name: string; value: string }[];
};

export const secretCreateCommand: CommandModule<RootArguments, SecretCreateArguments> = {
  command: 'create <name> <data...>',
  describe: 'Create a generic secret.',

  builder: (argv: Argv<RootArguments>) =>
    (argv
      .example(
        'kuby secret create my-secret foo=bar',
        'This creates an secret with the name my-secret and the data foo: bar. (bar will be base64 encoded)',
      )
      .example(
        'kuby secret create my-secret foo=bar this=that good="morning sir"',
        'This creates an secret with the name my-secret and the given data (encoded).',
      )
      .positional('name', {
        description: 'Name of the secret to create',
        type: 'string',
      })
      .option('dry-run', {
        boolean: true,
        default: false,
        description: "Don't create secret on server. Log it to console instead.",
      })
      .positional('data', {
        description: 'Array of secret data in the form of: key=value key=value key=value',
        coerce: (data: string[]) =>
          data
            .map(str => str.split('='))
            .map(([name, ...values]) => ({
              name,
              value: values.join('='),
            }))
            .filter(obj => obj.name && obj.value),
        type: 'string',
      }) as unknown) as Argv<SecretCreateArguments>,

  async handler(args: Arguments<SecretCreateArguments>): Promise<void> {
    const logger = new Logger('secrets');
    logger.debug('Create secret with data.');

    if (args.data.length <= 0) {
      logger.error('No data given. Must be in format key=value or key="value value". Aborting.');
      process.exit(ExitCode.error);
      return;
    }

    const api = KubernetesApi.fromDefault();

    logger.info(`Create secret with name "${args.name}".`);
    logger.debug(`Add ${args.data.length} data keys.`);
    try {
      const secret = {
        ...new V1Secret(),
        apiVersion: 'v1',
        kind: 'Secret',
        type: 'Opaque',
        metadata: {
          ...new V1ObjectMeta(),
          name: args.name,
        },
        data: args.data.reduce(
          (obj, cur) => {
            obj[cur.name] = cur.value.base64Encode();
            return obj;
          },
          {} as { [key: string]: string },
        ),
      };
      if (args.dryRun) {
        logger.info('Dry run set, only log the secret and return.');
        logger.output(`\n\n${dumpYaml(secret)}\n\n`);
      } else {
        logger.startSpinner('Creating...');
        await api.core.createNamespacedSecret(api.currentNamespace, secret);
        logger.stopSpinner();
      }
      logger.success('Secret created.');
    } catch ({ body: { message } }) {
      logger.stopSpinner();
      logger.error('There was an error during the creation of the secret:');
      logger.error(message);
      process.exit(ExitCode.error);
      return;
    }
  },
};
