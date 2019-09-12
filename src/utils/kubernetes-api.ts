import { CoreV1Api, KubeConfig } from '@kubernetes/client-node';
import { Context } from '@kubernetes/client-node/dist/config_types';

export class KubernetesApi {
  public static contextOverride: string | undefined;

  public static namespaceOverride: string | undefined;

  /**
   * Manage elements of the kubernetes core api.
   */
  public readonly core: CoreV1Api;

  /**
   * Manage kube-config.
   */
  public readonly kubeConfig: KubeConfig;

  /**
   * Convenience getter for current context.
   *
   * @throws {Error} When the returned context from the config is `null`.
   */
  public get currentContext(): Context {
    const contextName = this.kubeConfig.getCurrentContext();
    const context = this.kubeConfig.getContextObject(contextName);
    if (context == null) {
      throw new Error(`No context with name '${contextName}' found.`);
    }
    return context;
  }

  /**
   * Convenience getter for current namespace. Does take overrides into account (--ns).
   * Returns "default" when no "current" namespace is set
   * on the context.
   */
  public get currentNamespace(): string {
    return KubernetesApi.namespaceOverride || this.currentContext.namespace || 'default';
  }

  private constructor(kubeConfig: KubeConfig) {
    this.kubeConfig = kubeConfig;
    if (KubernetesApi.contextOverride) {
      this.kubeConfig.setCurrentContext(KubernetesApi.contextOverride);
    }

    this.core = this.kubeConfig.makeApiClient(CoreV1Api);
  }

  /**
   * Creates a kubernetes api from the default configuration
   * (located at `~/.kube/config` or the env var that points
   * to the kube config).
   */
  public static fromDefault(): KubernetesApi {
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromDefault();
    return new KubernetesApi(kubeConfig);
  }

  /**
   * Creates the kubernetes api from a given string content.
   */
  public static fromString(content: string): KubernetesApi {
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromString(content);
    return new KubernetesApi(kubeConfig);
  }
}
