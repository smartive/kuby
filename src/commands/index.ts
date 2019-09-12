import { CommandModule } from 'yargs';
import { applyCommand } from './apply';
import { base64Command } from './base64';
import { cleanupCommand } from './cleanup';
import { contextCommand } from './context';
import { deleteCommand } from './delete';
import { deployCommand } from './deploy';
import { kubeConfigCommand } from './kube-config';
import { kubectlCommand } from './kubectl';
import { namespaceCommand } from './namespace';
import { prepareCommand } from './prepare';
import { previewDeployCommand } from './preview-deploy';
import { secretCommand } from './secret';
import { versionCommand } from './version';

export const commands: CommandModule<any, any>[] = [
  applyCommand,
  base64Command,
  cleanupCommand,
  contextCommand,
  deleteCommand,
  deployCommand,
  kubeConfigCommand,
  kubectlCommand,
  namespaceCommand,
  prepareCommand,
  previewDeployCommand,
  secretCommand,
  versionCommand,
];
