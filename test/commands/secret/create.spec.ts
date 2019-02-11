import { secretCreateCommand as cmd } from '../../../src/commands/secret/create';
import { KubernetesApi } from '../../../src/utils/kubernetes-api';
import { Logger } from '../../../src/utils/logger';
import { clearGlobalMocks } from '../../helpers';

describe('commands / secret / create', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  beforeEach(() => {
    (KubernetesApi as any).create();
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it('should fail when no data is given', async () => {
    await cmd.handler({ name: 'name', data: [] } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith(
      'No data given. Must be in format key=value or key="value value". Aborting.',
    );
  });

  it('should create a namespaced secret', async () => {
    await cmd.handler({ name: 'name', data: [{ name: 'foo', value: 'bar' }] } as any);
    expect(((KubernetesApi as any).instance.core.createNamespacedSecret as jest.Mock).mock.calls[0]).toMatchSnapshot();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should log the error on a failure', async () => {
    ((KubernetesApi as any).instance.core.createNamespacedSecret as jest.Mock).mockRejectedValueOnce({
      body: { message: 'error' },
    });
    await cmd.handler({ name: 'name', data: [{ name: 'foo', value: 'bar' }] } as any);
    expect(process.exit).toHaveBeenLastCalledWith(1);
    expect((Logger as any).instance.error).toHaveBeenLastCalledWith('error');
  });
});
