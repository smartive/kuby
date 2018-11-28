import { write } from 'clipboardy';

import { base64DecodeCommand } from '../../src/commands/base64/decode';
import { Logger } from '../../src/utils/logger';
import { clearGlobalMocks } from '../helpers';

describe('commands / base64 / decode', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => clearGlobalMocks());

  it('should output base64 decoded content', async () => {
    await base64DecodeCommand.handler({
      content: 'Zm9vYmFy',
      noClip: false,
    });

    expect((Logger as any).instance.output.mock.calls[0][0]).toBe('foobar');
  });

  it('should write base64 decoded content to clipboard', async () => {
    await base64DecodeCommand.handler({
      content: 'Zm9vYmFy',
      noClip: false,
    });

    expect((write as any).mock.calls[0][0]).toBe('foobar');
  });

  it('should not write base64 decoded content to clipboard when noClip is set', async () => {
    await base64DecodeCommand.handler({
      content: 'Zm9vYmFy',
      noClip: true,
    });

    expect(write).not.toHaveBeenCalled();
  });
});
