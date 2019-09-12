import { prompt } from 'inquirer';
import { vol } from 'memfs';
import { posix } from 'path';
import { secretDockerRegistryCreateCommand as cmd } from '../../../src/commands/secret/docker-registry/create';
import { Crypto } from '../../../src/utils/crypto';
import { exec } from '../../../src/utils/exec';
import { Filepathes } from '../../../src/utils/filepathes';
import { Logger } from '../../../src/utils/logger';
import * as Confirm from '../../../src/utils/simple-confirm';
import { spawn } from '../../../src/utils/spawn';
import { clearGlobalMocks } from '../../helpers';

describe('commands / secret / docker-registry / create', () => {
  let cLoad: jest.SpyInstance;
  let cSave: jest.SpyInstance;
  let confirm: jest.SpyInstance;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    cLoad = jest.spyOn(Crypto, 'load').mockResolvedValue({
      server: 'server',
      user: 'user',
      email: 'email',
      password: 'password',
    });
    cSave = jest.spyOn(Crypto, 'save').mockResolvedValue(undefined);
    confirm = jest.spyOn(Confirm, 'simpleConfirm').mockResolvedValue(true);
  });

  afterEach(() => {
    clearGlobalMocks();
    cLoad.mockClear();
    cSave.mockClear();
    confirm.mockClear();
  });

  afterAll(() => {
    cLoad.mockRestore();
    cSave.mockRestore();
    confirm.mockRestore();
  });

  it('should fail if the secret already exists', async () => {
    (exec as jest.Mock).mockResolvedValue('foobar\nblub');
    await cmd.handler({ name: 'foobar' } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith('The secret "foobar" already exists.');
  });

  it('should only warn and return when the secret exists in CI mode', async () => {
    (exec as jest.Mock).mockResolvedValue('foobar\nblub');
    await cmd.handler({ name: 'foobar', ci: true } as any);
    expect(process.exit).not.toHaveBeenCalled();
    expect((Logger as any).instance.warn).toHaveBeenLastCalledWith('CI Mode: existing secret does not fail command.');
  });

  it('should load a secret from the filesystem when --from is defined', async () => {
    vol.fromJSON({
      [posix.join(Filepathes.dockerSecretPath, 'from')]: 'foo',
    });
    await cmd.handler({ name: 'mynewsecret', from: 'from', ci: true } as any);
    expect(cLoad).toHaveBeenCalledWith(posix.join(Filepathes.dockerSecretPath, 'from'));
  });

  it('should log an error message when secret in --from does not exist', async () => {
    await cmd.handler({ name: 'mynewsecret', from: 'from', ci: true } as any);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith(
      `The file ${posix.join(Filepathes.dockerSecretPath, 'from')} does not exist. Cannot use template.`,
    );
  });

  it('should ask the user if he wants to use a template', async () => {
    ((prompt as any) as jest.Mock).mockResolvedValueOnce({ file: 'foobar' });
    await cmd.handler({ name: 'mynewsecret' } as any);
    expect(prompt).toHaveBeenCalled();
  });

  it('should not ask the user if no-interaction is flagged', async () => {
    ((prompt as any) as jest.Mock).mockResolvedValueOnce({ file: 'foobar' });
    await cmd.handler({ name: 'mynewsecret', noInteraction: true } as any);
    expect(prompt).not.toHaveBeenCalled();
  });

  it.skip('should load the given secret if the user selects one', async () => {
    vol.fromJSON({
      [posix.join(Filepathes.dockerSecretPath, 'from')]: 'foo',
    });
    ((prompt as any) as jest.Mock).mockResolvedValueOnce({ file: 'from' });
    await cmd.handler({ name: 'mynewsecret' } as any);
    expect(cLoad).toHaveBeenCalledWith(posix.join(Filepathes.dockerSecretPath, 'from'));
  });

  it('should error when no interaction mode is on and not all arguments are given', async () => {
    ((prompt as any) as jest.Mock).mockResolvedValueOnce({ file: 'new' });
    await cmd.handler({ name: 'mynewsecret', noInteraction: true } as any);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith(
      'No interaction mode used but not all information present (server, user, mail, password).',
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should ask the user for missing information', async () => {
    ((prompt as any) as jest.Mock).mockResolvedValueOnce({ file: 'new' });
    await cmd.handler({ name: 'mynewsecret' } as any);
    expect(prompt).toHaveBeenCalledTimes(2);
  });

  it('should create a docker registry secret with the given information', async () => {
    await cmd.handler({ name: 'mynewsecret' } as any);
    expect(spawn).toHaveBeenCalledWith('kubectl', [
      'create',
      'secret',
      'docker-registry',
      'mynewsecret',
      '--docker-server=undefined',
      '--docker-username=undefined',
      '--docker-email=undefined',
      '--docker-password=undefined',
    ]);
  });

  it('should exit if kubectl errors', async () => {
    (spawn as jest.Mock).mockResolvedValue(1);
    ((prompt as any) as jest.Mock).mockResolvedValueOnce({ file: 'new' });
    await cmd.handler({ name: 'mynewsecret' } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith(
      'An error happend during the kubectl create secret command.',
    );
  });
});
