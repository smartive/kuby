import { applyCommand } from './apply';
import { base64Command } from './base64';
import { contextCommand } from './context';
import { deleteCommand } from './delete';
import { deployCommand } from './deploy';
import { kubeConfigCommand } from './kube-config';
import { kubectlCommand } from './kubectl';
import { namespaceCommand } from './namespace';
import { prepareCommand } from './prepare';
import { secretCommand } from './secret';
import { versionCommand } from './version';

export const commands = [
  applyCommand,
  base64Command,
  contextCommand,
  deleteCommand,
  deployCommand,
  kubeConfigCommand,
  kubectlCommand,
  namespaceCommand,
  prepareCommand,
  secretCommand,
  versionCommand,
];
