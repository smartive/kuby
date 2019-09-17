import { Arguments, Argv, CommandModule } from 'yargs';
import { kubeConfigCommand } from '../kube-config';
import { RootArguments } from '../../root-arguments';
import { exec } from '../../utils/exec';
import { Logger } from '../../utils/logger';
import { RcFile } from '../../utils/rc-file';
import { simpleConfirm } from '../../utils/simple-confirm';
import { spawn } from '../../utils/spawn';

export type CleanupArguments = RootArguments & {
  names: string[];
  resources: string[];
  dryRun: boolean;
  exactMatch?: boolean;
  regex?: boolean;
};

class Resource {
  public get identifier(): string {
    return `${this.type}/${this.name}`;
  }

  constructor(public readonly type: string, public readonly name: string, public readonly namespace: string) {}
}

function namePattern({ exactMatch, regex }: CleanupArguments): string {
  switch (true) {
    case exactMatch && !regex:
      return 'exact';
    case !exactMatch && !regex:
      return 'partial';
    case !exactMatch && regex:
      return 'pattern';
    default:
      throw new Error('not possible name combo found.');
  }
}

function resourceFilter({ exactMatch, regex, names }: CleanupArguments): (resource: Resource) => boolean {
  return ({ name }) => {
    switch (true) {
      case regex:
        return names.map(n => new RegExp(n, 'g')).some(exp => exp.test(name));
      case !regex && exactMatch:
        return names.includes(name);
      case !regex && !exactMatch:
        return names.some(n => name.includes(n));
      default:
        return false;
    }
  };
}

export const cleanupCommand: CommandModule<RootArguments, CleanupArguments> = {
  command: 'cleanup <names...>',
  describe:
    'Cleanup a namespace. Remove (delete) the given resources that contain "name" in it (you can add multiple names).',

  builder: (argv: Argv<RootArguments>) =>
    (argv
      .positional('names', {
        type: 'string',
        array: true,
        description: 'The names of the resources that should be deleted.',
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
      .option('regex', {
        boolean: true,
        conflicts: 'exact-match',
        description: 'Use the inputted names as regex patterns to determine if the resource should be deleted.',
      })
      .option('dry-run', {
        boolean: true,
        default: false,
        description: "Don't delete the resources, just print what would've been deleted.",
      })
      .option('exact-match', {
        boolean: true,
        description: 'Use an exact name match and not a partial match.',
      }) as unknown) as Argv<CleanupArguments>,

  async handler(args: Arguments<CleanupArguments>): Promise<void> {
    const logger = new Logger('cleanup');
    logger.debug(
      `Delete resources: ${args.resources.join(',')} within the namespace with the ${namePattern(
        args,
      )} names ${args.names.join(', ')}.`,
    );
    logger.info('Cleanup resources from the namespace.');
    
    if(args.ci) {
      await kubeConfigCommand.handler({
        ...args,
        noInteraction: true,
        force: true,
      });
    }

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
      .filter(resourceFilter(args))
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
