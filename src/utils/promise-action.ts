import { ExitCode } from './exit-code';

export function promiseAction(
  action: (...args: any[]) => Promise<number | null>,
): (...args: any[]) => void {
  return (...args: any[]) => {
    action(...args)
      .then((result: number | null) => {
        if (result !== null) {
          process.exit(result);
        }
      })
      .catch((reason: Error) => {
        console.error('An unexpected error happend.', reason);
        process.exit(ExitCode.error);
      });
  };
}
