import { homedir } from 'os';
import { join } from 'path';

const basepath = join(homedir(), '.kube', 'k8s-helpers');

export class Filepathes {
  public static get namespacePath(): string {
    return join(basepath, 'namespace');
  }

  public static get namespaceDefaultRolePath(): string {
    return join(this.namespacePath, 'default-role.yml');
  }

  private constructor() {}
}
