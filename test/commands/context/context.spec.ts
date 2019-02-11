import { prompt } from 'inquirer';
import { EOL } from 'os';

import { contextCommand } from '../../../src/commands/context';
import { exec } from '../../../src/utils/exec';
import { Logger } from '../../../src/utils/logger';
import { clearGlobalMocks } from '../../helpers';

describe('commands / context', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it('should return when used with completion args', async () => {
    expect(await contextCommand.handler({ getYargsCompletions: true } as any)).toBeUndefined();
    expect((Logger as any).instance).toBeUndefined();
  });

  it('should ask the user if no <context> is set', async () => {
    (prompt as jest.Mock).mockResolvedValue({ context: 'current' });
    (exec as jest.Mock).mockResolvedValueOnce('current').mockResolvedValueOnce(`current${EOL}non-current${EOL}third`);

    await contextCommand.handler({} as any);

    expect(prompt).toHaveBeenCalled();
  });

  it('should not ask the user if <context> is set', async () => {
    (exec as jest.Mock).mockResolvedValueOnce('current').mockResolvedValueOnce(`current${EOL}non-current${EOL}third`);

    await contextCommand.handler({ name: 'current' } as any);

    expect(prompt).not.toHaveBeenCalled();
  });

  it('should not do anything if <context> is current', async () => {
    (exec as jest.Mock).mockResolvedValueOnce('current').mockResolvedValueOnce(`current${EOL}non-current${EOL}third`);

    await contextCommand.handler({ name: 'current' } as any);

    expect((Logger as any).instance.info.mock.calls[0][0]).toBe('No different context selected, exiting.');
  });

  it('should exit if <context> does not exist', async () => {
    (exec as jest.Mock).mockResolvedValueOnce('current').mockResolvedValueOnce(`current${EOL}non-current${EOL}third`);

    await contextCommand.handler({ name: 'foobar' } as any);

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should switch then context if <context> does exist', async () => {
    (prompt as jest.Mock).mockResolvedValue({ context: 'current' });
    (exec as jest.Mock).mockResolvedValueOnce('current').mockResolvedValueOnce(`current${EOL}non-current${EOL}third`);

    await contextCommand.handler({ name: 'third' } as any);

    expect(process.exit).not.toHaveBeenCalled();
    expect(exec).toHaveBeenNthCalledWith(3, `kubectl config use-context "third"`);
  });
});
