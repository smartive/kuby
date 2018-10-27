import chalk from 'chalk';

import { RootArguments } from '../root-arguments';

export class RcFile {
  private constructor() {}

  public static getKubectlArguments(
    rootArgs: RootArguments,
    args: string[],
  ): string[] {
    if (rootArgs.namespace) {
      console.log(`Namespace set to ${chalk.yellow(rootArgs.namespace)}.`);
      args.unshift(rootArgs.namespace);
      args.unshift('--namespace');
    }
    if (rootArgs.context) {
      console.log(`Context set to ${chalk.yellow(rootArgs.context)}.`);
      args.unshift(rootArgs.context);
      args.unshift('--context');
    }
    return args;
  }
}
