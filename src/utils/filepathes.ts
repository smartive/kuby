import { homedir } from 'os';
import { posix } from 'path';

const basepath = posix.join(homedir(), '.kube', 'kuby');

export class Filepathes {
  public static get configPath(): string {
    return posix.join(homedir(), '.kube', 'config');
  }

  public static get dockerSecretPath(): string {
    return posix.join(this.secretsPath, 'docker-registry');
  }

  public static get kubectlInstallPath(): string {
    return posix.join(basepath, 'kubectl');
  }

  public static get kubectlVersionsPath(): string {
    return posix.join(this.kubectlInstallPath, 'versions');
  }

  public static get namespacePath(): string {
    return posix.join(basepath, 'namespace');
  }

  public static get namespaceDefaultRolePath(): string {
    return posix.join(this.namespacePath, 'default-role.yml');
  }

  public static get secretsPath(): string {
    return posix.join(basepath, 'secret');
  }

  private constructor() {}
}
