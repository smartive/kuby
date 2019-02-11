import { write } from 'clipboardy';

import { base64EncodeCommand } from '../../../src/commands/base64/encode';
import { Logger } from '../../../src/utils/logger';
import { clearGlobalMocks } from '../../helpers';

describe('commands / base64 / encode', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => clearGlobalMocks());

  it('should output base64 encoded content', async () => {
    await base64EncodeCommand.handler({
      content: 'foobar',
      noClip: false,
    } as any);

    expect((Logger as any).instance.output.mock.calls[0][0]).toBe('Zm9vYmFy');
  });

  it('should write base64 encoded content to clipboard', async () => {
    await base64EncodeCommand.handler({
      content: 'foobar',
      noClip: false,
    } as any);

    expect((write as any).mock.calls[0][0]).toBe('Zm9vYmFy');
  });

  it('should not write base64 encoded content to clipboard when noClip is set', async () => {
    await base64EncodeCommand.handler({
      content: 'foobar',
      noClip: true,
    } as any);

    expect(write).not.toHaveBeenCalled();
  });
});
