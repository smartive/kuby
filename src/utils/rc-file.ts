import chalk from 'chalk';

import { RootArguments } from '../root-arguments';
import { Logger } from './logger';

export class RcFile {
  private static logger: Logger = new Logger('.rc file');

  private constructor() {}

  public static getKubectlArguments(
    rootArgs: RootArguments,
    args: string[],
  ): string[] {
    let kubectlArgs = RcFile.getKubectlCtxArguments(rootArgs, args);
    kubectlArgs = RcFile.getKubectlNsArguments(rootArgs, kubectlArgs);
    return kubectlArgs;
  }

  public static getKubectlCtxArguments(
    { context }: RootArguments,
    args: string[],
  ): string[] {
    if (context) {
      RcFile.logger.info(`Context set to ${chalk.yellow(context)}.`);
      args.unshift(context);
      args.unshift('--context');
    }
    return args;
  }

  public static getKubectlNsArguments(
    { namespace }: RootArguments,
    args: string[],
  ): string[] {
    if (namespace) {
      RcFile.logger.info(`Namespace set to ${chalk.yellow(namespace)}.`);
      args.unshift(namespace);
      args.unshift('--namespace');
    }
    return args;
  }
}
