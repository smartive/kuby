import { ExitCode } from './exit-code';

export function promiseAction(action: (...args: any[]) => Promise<number>): (...args: any[]) => void {
  return (...args: any[]) => {
    action(...args)
      .then(process.exit)
      .catch((reason) => {
        console.error('An unexpected error happend.', reason);
        process.exit(ExitCode.error);
      });
  };
}
