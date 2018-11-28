import { vol } from 'memfs';
import { homedir } from 'os';
import { posix } from 'path';

import { kubeConfigCommand } from '../../src/commands/kube-config';
import { Logger } from '../../src/utils/logger';
import * as Helper from '../../src/utils/simple-confirm';
import { clearGlobalMocks } from '../helpers';

describe('commands / kube-config', () => {
  const configPath = posix.join(homedir(), '.kube', 'config');
  let confirm: jest.Mock;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    confirm = jest.spyOn(Helper, 'simpleConfirm').mockResolvedValue(true);
  });

  afterEach(() => {
    clearGlobalMocks();
    delete process.env['KUBE_CONFIG'];
    confirm.mockClear();
  });

  afterAll(() => {
    confirm.mockRestore();
  });

  it('should exit when no content given and no env var is set', async () => {
    await kubeConfigCommand.handler({ noInteraction: true } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error.mock.calls[0][0]).toBe(
      'Neither env variable nor content provided. Aborting.',
    );
  });

  it('should exit when content is empty', async () => {
    await kubeConfigCommand.handler({
      noInteraction: true,
      configContent: '   ',
    } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error.mock.calls[0][0]).toBe(
      'Config content is empty. Aborting.',
    );
  });

  it('should exit when env var is empty', async () => {
    process.env['KUBE_CONFIG'] = '   ';
    await kubeConfigCommand.handler({
      noInteraction: true,
    } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error.mock.calls[0][0]).toBe(
      'Config content is empty. Aborting.',
    );
  });

  it('should exit when content is not base64', async () => {
    await kubeConfigCommand.handler({
      noInteraction: true,
      configContent: 'FOO',
    } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error.mock.calls[0][0]).toBe(
      'The content is not base64 encoded. Aborting.',
    );
  });

  it('should exit when env var is not base64', async () => {
    process.env['KUBE_CONFIG'] = 'FOO';
    await kubeConfigCommand.handler({ noInteraction: true } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error.mock.calls[0][0]).toBe(
      'The content is not base64 encoded. Aborting.',
    );
  });

  it('should write the ~/.kube/config file when it does not exist', async () => {
    await kubeConfigCommand.handler({ configContent: 'Zm9vYmFy' } as any);
    expect(vol.toJSON()).toEqual({
      [configPath]: 'foobar',
    });
  });

  it('should do nothing when config exists and in no interaction mode', async () => {
    vol.fromJSON({
      [configPath]: 'whatever',
    });
    await kubeConfigCommand.handler({
      configContent: 'Zm9vYmFy',
      noInteraction: true,
    } as any);
    expect(vol.toJSON()).toEqual({
      [configPath]: 'whatever',
    });
    expect((Logger as any).instance.info.mock.calls[0][0]).toBe(
      'Config already exists, exitting.',
    );
  });

  it('should ask the user if the config should be overwritten', async () => {
    confirm.mockResolvedValue(false);
    vol.fromJSON({
      [configPath]: 'whatever',
    });
    await kubeConfigCommand.handler({
      configContent: 'Zm9vYmFy',
      noInteraction: false,
    } as any);
    expect(vol.toJSON()).toEqual({
      [configPath]: 'whatever',
    });
  });

  it('should overwrite the config when the user accepts', async () => {
    confirm.mockResolvedValue(true);
    vol.fromJSON({
      [configPath]: 'whatever',
    });
    await kubeConfigCommand.handler({
      configContent: 'Zm9vYmFy',
      noInteraction: false,
    } as any);
    expect(vol.toJSON()).toEqual({
      [configPath]: 'foobar',
    });
  });
});
