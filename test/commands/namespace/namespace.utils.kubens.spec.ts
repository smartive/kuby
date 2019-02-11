import * as Kubectx from '../../../src/commands/context/utils/kubectx';
import * as Kubens from '../../../src/commands/namespace/utils/kubens';
import { exec } from '../../../src/utils/exec';
import { clearGlobalMocks } from '../../helpers';

describe('commands / namespace / utils / kubens', () => {
  let currentContext: jest.Mock;

  beforeAll(() => {
    process.exit = jest.fn() as any;
    currentContext = jest
      .spyOn(Kubectx, 'getCurrentContext')
      .mockResolvedValue('currentCtx');
  });

  afterEach(() => {
    clearGlobalMocks();
    currentContext.mockClear();
  });

  afterAll(() => {
    currentContext.mockRestore();
  });

  describe('getCurrentNamespace()', () => {
    it('should get the current contexts namespace', async () => {
      await Kubens.getCurrentNamespace();
      expect(currentContext).toHaveBeenCalled();
    });

    it('should call exec with the namespace command', async () => {
      await Kubens.getCurrentNamespace();
      expect(exec).toHaveBeenCalledWith(
        `kubectl config view -o=jsonpath='{.contexts[?(@.name=="currentCtx")].context.namespace}'`,
      );
    });
  });

  describe('getNamespaces()', () => {
    it('should get all namespaces', async () => {
      (exec as jest.Mock).mockResolvedValueOnce(`\nbar\nfoo`);
      const result = await Kubens.getNamespaces();
      expect(result).toEqual(['bar', 'foo']);
    });

    it('should filter empty values', async () => {
      (exec as jest.Mock).mockResolvedValueOnce(`foo\n\nbar\n\n`);
      const result = await Kubens.getNamespaces();
      expect(result).toEqual(['bar', 'foo']);
    });

    it('should sort the list', async () => {
      (exec as jest.Mock).mockResolvedValueOnce(`foo\nbar`);
      const result = await Kubens.getNamespaces();
      expect(result).toEqual(['bar', 'foo']);
    });
  });

  describe('getServiceAccountsForNamespace()', () => {
    it('should get the service accounts of a namespace', async () => {
      (exec as jest.Mock).mockResolvedValueOnce(`svc1\nsvc2`);
      const result = await Kubens.getServiceAccountsForNamespace('');
      expect(result).toEqual(['svc1', 'svc2']);
    });

    it('should filter empty values', async () => {
      (exec as jest.Mock).mockResolvedValueOnce(`svc1\n\nsvc2\n\n`);
      const result = await Kubens.getServiceAccountsForNamespace('');
      expect(result).toEqual(['svc1', 'svc2']);
    });

    it('should sort the list', async () => {
      (exec as jest.Mock).mockResolvedValueOnce(`svc2\nsvc1`);
      const result = await Kubens.getServiceAccountsForNamespace('');
      expect(result).toEqual(['svc1', 'svc2']);
    });
  });
});
