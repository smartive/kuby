import { EOL } from 'os';

import { exec } from '../../../utils/exec';

export function getCurrentContext(): Promise<string> {
  return exec(`kubectl config view -o=jsonpath='{.current-context}'`);
}

export async function getContexts(): Promise<string[]> {
  const value = await exec('kubectl config get-contexts -o=name');
  return value
    .split(EOL)
    .filter(ctx => !!ctx)
    .sort();
}
