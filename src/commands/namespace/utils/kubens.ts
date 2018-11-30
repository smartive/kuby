import { exec } from '../../../utils/exec';
import { getCurrentContext } from '../../context/utils/kubectx';

export async function getCurrentNamespace(): Promise<string> {
  const currentContext = await getCurrentContext();
  return await exec(
    `kubectl config view -o=jsonpath='{.contexts[?(@.name=="${currentContext}")].context.namespace}'`,
  );
}

export async function getNamespaces(): Promise<string[]> {
  const value = await exec(
    `kubectl get namespaces -o=jsonpath='{range .items[*].metadata.name}{@}{"\\n"}{end}'`,
  );
  return value
    .split('\n')
    .filter(ns => !!ns)
    .sort();
}

export async function getServiceAccountsForNamespace(
  namespace: string,
): Promise<string[]> {
  const value = await exec(
    `kubectl get serviceaccounts -n ${namespace} -o=jsonpath='{range .items[*].metadata.name}{@}{"\\n"}{end}'`,
  );
  return value
    .split('\n')
    .filter(sa => !!sa)
    .sort();
}
