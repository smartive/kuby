import { prompt } from 'inquirer';

import * as Kubectx from '../../../src/commands/context/utils/kubectx';
import { namespaceCommand } from '../../../src/commands/namespace';
import * as Kubens from '../../../src/commands/namespace/utils/kubens';
import { exec } from '../../../src/utils/exec';
import { Logger } from '../../../src/utils/logger';
import { clearGlobalMocks } from '../../helpers';

describe('commands / namespace', () => {
  let currentContext: jest.Mock;
  let currentNamespace: jest.Mock;
  let namespaces: jest.Mock;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    currentContext = jest
      .spyOn(Kubectx, 'getCurrentContext')
      .mockResolvedValue('context');
    currentNamespace = jest
      .spyOn(Kubens, 'getCurrentNamespace')
      .mockResolvedValue('current');
    namespaces = jest
      .spyOn(Kubens, 'getNamespaces')
      .mockResolvedValue(['ns1', 'ns2']);
  });

  afterEach(() => {
    clearGlobalMocks();
    currentContext.mockClear();
    currentNamespace.mockClear();
    namespaces.mockClear();
  });

  afterAll(() => {
    currentContext.mockRestore();
    currentNamespace.mockRestore();
    namespaces.mockRestore();
  });

  it('should return when called with completion args', async () => {
    await namespaceCommand.handler({
      getYargsCompletions: true,
    } as any);
    expect((Logger as any).instance.debug).not.toHaveBeenCalled();
  });

  it('should ask the user if no name was given', async () => {
    await namespaceCommand.handler({} as any);
    expect(prompt).toHaveBeenCalled();
  });

  it('should do nothing if the selected is the same as current', async () => {
    await namespaceCommand.handler({ name: 'current' } as any);
    expect((Logger as any).instance.info).toHaveBeenLastCalledWith(
      'No different namespace selected, exiting.',
    );
  });

  it('should fail if the namespace does not exist', async () => {
    await namespaceCommand.handler({ name: 'foo' } as any);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith(
      'The namespace "foo" does not exist.',
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should switch the namespace of the context', async () => {
    await namespaceCommand.handler({ name: 'ns2' } as any);
    expect(exec).toHaveBeenCalledWith(
      'kubectl config set-context "context" --namespace="ns2"',
    );
  });
});
