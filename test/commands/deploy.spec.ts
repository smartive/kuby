import { applyCommand } from '../../src/commands/apply';
import { deployCommand } from '../../src/commands/deploy';
import { prepareCommand } from '../../src/commands/prepare';
import { Logger } from '../../src/utils/logger';
import { clearGlobalMocks } from '../helpers';

describe('commands / deploy', () => {
  let prepare: jest.Mock;
  let apply: jest.Mock;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    prepare = jest
      .spyOn(prepareCommand, 'handler')
      .mockResolvedValue(undefined);
    apply = jest.spyOn(applyCommand, 'handler').mockResolvedValue(undefined);
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
    expect(
      await deployCommand.handler({ getYargsCompletions: true } as any),
    ).toBeUndefined();
    expect((Logger as any).instance.debug).not.toHaveBeenCalled();
  });

  it('should call prepare', async () => {
    await deployCommand.handler({});
    expect(prepare).toHaveBeenCalled();
  });

  it('should call apply', async () => {
    await deployCommand.handler({});
    expect(apply).toHaveBeenCalled();
  });
});
