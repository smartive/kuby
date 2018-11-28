import { homedir } from 'os';
import { join } from 'path';

const basepath = join(homedir(), '.kube', 'k8s-helpers');

export class Filepathes {
  public static get configPath(): string {
    return join(homedir(), '.kube', 'config');
  }

  public static get dockerSecretPath(): string {
    return join(this.secretsPath, 'docker-registry');
  }

  public static get kubectlInstallPath(): string {
    return join(basepath, 'kubectl');
  }

  public static get kubectlVersionsPath(): string {
    return join(this.kubectlInstallPath, 'versions');
  }

  public static get namespacePath(): string {
    return join(basepath, 'namespace');
  }

  public static get namespaceDefaultRolePath(): string {
    return join(this.namespacePath, 'default-role.yml');
  }

  public static get secretsPath(): string {
    return join(basepath, 'secret');
  }

  private constructor() {}
}
