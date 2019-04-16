import { write } from 'clipboardy';
import { prompt, registerPrompt } from 'inquirer';
import { vol } from 'memfs';

import { exec } from '../src/utils/exec';
import { KubernetesApi } from '../src/utils/kubernetes-api';
import { Logger } from '../src/utils/logger';
import { spawn } from '../src/utils/spawn';

export function clearGlobalMocks(): void {
  (process as any).exit.mockClear();
  (spawn as any as jest.Mock<number>).mockClear();
  (exec as jest.Mock).mockClear();
  (write as jest.Mock).mockClear();
  (prompt as any as jest.Mock).mockClear();
  (registerPrompt as jest.Mock).mockClear();
  (Logger as any).instance = undefined;
  (KubernetesApi as any).instance = undefined;
  vol.reset();
}
