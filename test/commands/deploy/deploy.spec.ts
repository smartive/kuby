import { applyCommand } from '../../../src/commands/apply';
import { deployCommand } from '../../../src/commands/deploy';
import { prepareCommand } from '../../../src/commands/prepare';
import { Logger } from '../../../src/utils/logger';
import { clearGlobalMocks } from '../../helpers';

describe('commands / deploy', () => {
  let prepare: jest.SpyInstance;
  let apply: jest.SpyInstance;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    prepare = jest.spyOn<any, any>(prepareCommand, 'handler').mockResolvedValue(undefined);
    apply = jest.spyOn<any, any>(applyCommand, 'handler').mockResolvedValue(undefined);
  });

  afterEach(() => {
    clearGlobalMocks();
    prepare.mockClear();
    apply.mockClear();
  });

  afterAll(() => {
    prepare.mockRestore();
    apply.mockRestore();
  });

  it('should return when used with completion args', async () => {
    expect(await deployCommand.handler({ getYargsCompletions: true } as any)).toBeUndefined();
    expect((Logger as any).instance.debug).not.toHaveBeenCalled();
  });

  it('should call prepare', async () => {
    await deployCommand.handler({} as any);
    expect(prepare).toHaveBeenCalled();
  });

  it('should call apply', async () => {
    await deployCommand.handler({} as any);
    expect(apply).toHaveBeenCalled();
  });
});
