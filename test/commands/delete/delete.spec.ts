import { deleteCommand } from '../../../src/commands/delete';
import { kubeConfigCommand } from '../../../src/commands/kube-config';
import { prepareCommand } from '../../../src/commands/prepare';
import { Logger } from '../../../src/utils/logger';
import { spawn } from '../../../src/utils/spawn';
import { clearGlobalMocks } from '../../helpers';

describe('commands / delete', () => {
  let prepare: jest.Mock;
  let kubeConfig: jest.Mock;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    prepare = jest.spyOn<any, any>(prepareCommand, 'handler').mockResolvedValue(undefined);
    kubeConfig = jest.spyOn(kubeConfigCommand, 'handler').mockResolvedValue(undefined);
  });

  afterEach(() => {
    clearGlobalMocks();
    prepare.mockClear();
    kubeConfig.mockClear();
  });

  afterAll(() => {
    prepare.mockRestore();
    kubeConfig.mockRestore();
  });

  it('should return when used with completion args', async () => {
    expect(await deleteCommand.handler({ getYargsCompletions: true } as any)).toBeUndefined();
    expect((Logger as any).instance.debug).not.toHaveBeenCalled();
  });

  it('should call prepare', async () => {
    await deleteCommand.handler({} as any);
    expect(prepare).toHaveBeenCalled();
  });

  it('should call kubeConfig (login) when in ci mode', async () => {
    await deleteCommand.handler({ ci: true } as any);
    expect(kubeConfig).toHaveBeenCalled();
  });

  it('should call kubectl delete', async () => {
    (spawn as jest.Mock).mockResolvedValue(0);
    await deleteCommand.handler({ destinationFolder: './foobar' } as any);
    expect(spawn).toHaveBeenCalledWith('kubectl', ['delete', '-f', './foobar']);
  });

  it('should exit when kubectl returns non zero exitcode', async () => {
    (spawn as jest.Mock).mockResolvedValue(1);
    await deleteCommand.handler({ destinationFolder: './foobar' } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
