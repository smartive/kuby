import { vol } from 'memfs';

import { spawn } from '../src/utils/spawn';

export function clearGlobalMocks(): void {
  (process as any).exit.mockClear();
  (spawn as jest.Mock<number>).mockClear();
  vol.reset();
}
