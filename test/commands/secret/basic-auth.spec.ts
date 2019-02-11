import { prompt } from 'inquirer';

import { secretBasicAuthCommand as cmd } from '../../../src/commands/secret/basic-auth';
import { secretCreateCommand } from '../../../src/commands/secret/create';
import { clearGlobalMocks } from '../../helpers';

describe('commands / secret / basic-auth', () => {
  let create: jest.Mock;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    create = jest.spyOn(secretCreateCommand, 'handler').mockResolvedValue(undefined);
  });

  afterEach(() => {
    clearGlobalMocks();
    create.mockClear();
  });

  afterAll(() => {
    create.mockRestore();
  });

  it('should ask for username when not given', async () => {
    (prompt as jest.Mock).mockResolvedValueOnce({
      username: 'user',
      password: 'pass',
    });
    await cmd.handler({ name: 'secret' } as any);
    expect(prompt as jest.Mock).toHaveBeenCalled();
  });

  it('should ask for password when not given', async () => {
    (prompt as jest.Mock).mockResolvedValueOnce({
      password: 'pass',
    });
    await cmd.handler({ name: 'secret', username: 'user' } as any);
    expect(prompt as jest.Mock).toHaveBeenCalled();
  });

  it('should call secret create handler with specific data', async () => {
    await cmd.handler({ name: 'secret', username: 'user', password: 'pass' } as any);
    expect(create.mock.calls[0][0]).toHaveProperty('name', 'secret');
    expect(create.mock.calls[0][0]['data'][0]).toHaveProperty('name', 'auth');
    expect(create.mock.calls[0][0]['data'][0]['value']).toMatch(/user[:].*$/);
  });
});
