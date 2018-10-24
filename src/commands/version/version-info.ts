/**
 * Version info for the tooling and the kubectl cli as well.
 * Does not contain the `v` in `kubectlVersion`.
 *
 * @export
 * @interface VersionInfo
 */
export interface VersionInfo {
  toolVersion: string;
  kubectlVersion: string;
  kubectlPlatform: string;
}
