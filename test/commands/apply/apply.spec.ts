import { vol } from 'memfs';

import { applyCommand } from '../../../src/commands/apply';
import { kubeConfigCommand } from '../../../src/commands/kube-config';
import { spawn } from '../../../src/utils/spawn';
import { clearGlobalMocks } from '../../helpers';

describe('commands / apply', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it('should return when used with completion args', async () => {
    expect(await applyCommand.handler({ getYargsCompletions: true } as any)).toBeUndefined();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should fail when deployfolder is not present', async () => {
    await applyCommand.handler({ deployFolder: './deploy' } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should not fail when deployfolder is not present', async () => {
    vol.fromJSON(
      {
        './deploy/file.yml': '',
      },
      process.cwd(),
    );
    await applyCommand.handler({ deployFolder: './deploy' } as any);
    expect(process.exit).not.toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledWith('kubectl', ['apply', '-f', './deploy']);
  });

  it('should fail when spawn returns non zero code', async () => {
    vol.fromJSON(
      {
        './deploy/file.yml': '',
      },
      process.cwd(),
    );
    (spawn as jest.Mock<number>).mockReturnValue(1);
    await applyCommand.handler({ deployFolder: './deploy' } as any);
    expect(process.exit).toHaveBeenCalled();
  });

  it('should call kube-config command in ci mode', async () => {
    kubeConfigCommand.handler = jest.fn(() => Promise.resolve());
    vol.fromJSON(
      {
        './deploy/file.yml': '',
      },
      process.cwd(),
    );
    await applyCommand.handler({ deployFolder: './deploy', ci: true } as any);
    expect(kubeConfigCommand.handler).toHaveBeenCalled();
  });
});
