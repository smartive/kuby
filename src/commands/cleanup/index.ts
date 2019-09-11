import { Arguments, Argv, CommandModule } from 'yargs';
import { RootArguments } from '../../root-arguments';
import { exec } from '../../utils/exec';
import { Logger } from '../../utils/logger';
import { RcFile } from '../../utils/rc-file';
import { simpleConfirm } from '../../utils/simple-confirm';
import { spawn } from '../../utils/spawn';

type CleanupArguments = RootArguments & {
  name: string;
  exactMatch: boolean;
  dryRun: boolean;
  resources: string[];
};

class Resource {
  public get identifier(): string {
    return `${this.type}/${this.name}`;
  }

  constructor(public readonly type: string, public readonly name: string, public readonly namespace: string) {}
}

export const cleanupCommand: CommandModule<RootArguments, CleanupArguments> = {
  command: 'cleanup <name>',
  describe: 'Cleanup a namespace. Remove (delete) the given resources that contain "name" in it.',

  builder: (argv: Argv<RootArguments>) =>
    (argv
      .positional('name', {
        type: 'string',
        description: 'The of the resources that should be deleted.',
      })
      .option('resources', {
        alias: 'r',
        array: true,
        string: true,
        default: ['ingress', 'service', 'deployment', 'pvc', 'configmap', 'secret', 'certificate'],
        description:
          'Defines a list of resources that should be cleaned up. If a comma separated list is given, it is split.',
        coerce(args: string[]): string[] {
          const result = [];
          for (const arg of args) {
            result.push(...arg.split(','));
          }
          return result;
        },
      })
      .option('dry-run', {
        boolean: true,
        default: false,
        description: "Don't delete the resources, just print what would've been deleted.",
      })
      .option('exact-match', {
        boolean: true,
        default: false,
        description: 'Use an exact name match and not a partial match.',
      }) as unknown) as Argv<CleanupArguments>,

  async handler(args: Arguments<CleanupArguments>): Promise<void> {
    const logger = new Logger('cleanup');
    logger.debug('Cleanup the actual namespace.');
    logger.info(
      `Delete resources: ${args.resources.join(',')} within the namespace with the ${
        args.exactMatch ? 'exact' : 'partial'
      } name ${args.name}.`,
    );

    const resources = (await exec(
      `kubectl ${RcFile.getKubectlArguments(args, []).join(' ')} get ${args.resources.join(
        ',',
      )} -o jsonpath="{range $.items[*]}{.kind}|{.metadata.name}|{.metadata.namespace}{'\\n'}{end}"`,
    ))
      .split('\n')
      .filter(Boolean)
      .map(str => str.split('|'))
      .map(([type, name, namespace]) => new Resource(type, name, namespace));

    const toDelete = resources
      .filter(r => !!!args.namespace || args.namespace === r.namespace)
      .filter(r => (args.exactMatch && args.name === r.name) || (!args.exactMatch && r.name.includes(args.name)))
      .map(r => r.identifier);

    if (toDelete.length <= 0) {
      logger.info('No items to delete. Return.');
      return;
    }

    if (args.dryRun) {
      logger.output(`DRY-RUN - Deletion would include:\n${toDelete.join('\n')}`);
      return;
    }

    if (!args.ci && !(await simpleConfirm(`Do you want to proceed and delete ${toDelete.length} resources?`, false))) {
      logger.info('Aborting.');
      return;
    }

    await spawn('kubectl', RcFile.getKubectlArguments(args, ['delete', ...toDelete]));
    logger.success('Resources cleaned up.');
  },
};
