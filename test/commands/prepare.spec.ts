import { vol } from 'memfs';
import { posix } from 'path';

import { prepareCommand } from '../../src/commands/prepare';
import { Logger } from '../../src/utils/logger';
import { clearGlobalMocks } from '../helpers';

describe('commands / prepare', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it('should return when called with completion args', async () => {
    await prepareCommand.handler({
      getYargsCompletions: true,
    } as any);
    expect((Logger as any).instance).toBeUndefined();
  });

  it('should fail when the source folder not exists', async () => {
    await prepareCommand.handler({
      sourceFolder: '/source',
      destinationFolder: '/destination',
    } as any);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith(
      'Source directory does not exist. Aborting.',
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should warn if the destination folder already exists', async () => {
    vol.fromJSON(
      {
        './source/foo': '',
        './destination/foo': '',
      },
      process.cwd(),
    );
    await prepareCommand.handler({
      sourceFolder: './source',
      destinationFolder: './destination',
    } as any);
    expect((Logger as any).instance.warn).toHaveBeenLastCalledWith(
      'Destination directory already exists, cleaning directory.',
    );
  });

  it('should write the files that are found (with nesting replaced by "-")', async () => {
    vol.fromJSON(
      {
        './source/foo.yml': '',
        './source/bar.yaml': '',
        './source/blub/whatever.yml': '',
        './source/blub/iaml.yaml': '',
      },
      process.cwd(),
    );
    await prepareCommand.handler({
      sourceFolder: './source',
      destinationFolder: './destination',
    } as any);
    expect(Object.keys(vol.toJSON())).toContain(
      posix.join(process.cwd(), 'destination', 'bar.yaml'),
    );
    expect(Object.keys(vol.toJSON())).toContain(
      posix.join(process.cwd(), 'destination', 'foo.yml'),
    );
    expect(Object.keys(vol.toJSON())).toContain(
      posix.join(process.cwd(), 'destination', 'blub-whatever.yml'),
    );
    expect(Object.keys(vol.toJSON())).toContain(
      posix.join(process.cwd(), 'destination', 'blub-iaml.yaml'),
    );
  });
});
