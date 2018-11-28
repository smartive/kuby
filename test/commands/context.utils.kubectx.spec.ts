import { EOL } from 'os';

import {
  getContexts,
  getCurrentContext,
} from '../../src/commands/context/utils/kubectx';
import { exec } from '../../src/utils/exec';
import { clearGlobalMocks } from '../helpers';

describe('commands / context / utils / kubectx', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  describe('getContexts()', () => {
    it('should call kubectl config', async () => {
      (exec as jest.Mock).mockReturnValue('');
      await getContexts();
      expect(exec as jest.Mock).toHaveBeenCalledWith(
        'kubectl config get-contexts -o=name',
      );
    });

    it('should split contexts by EOL', async () => {
      (exec as jest.Mock).mockReturnValue(`foo${EOL}bar${EOL}`);
      const result = await getContexts();
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
    });

    it('should filter empty values', async () => {
      (exec as jest.Mock).mockReturnValue(`foo${EOL}bar${EOL}${EOL}${EOL}`);
      const result = await getContexts();
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
    });

    it('should sort the list', async () => {
      (exec as jest.Mock).mockReturnValue(`foo${EOL}bar${EOL}`);
      const result = await getContexts();
      expect(result).toBeInstanceOf(Array);
      expect(result).toEqual(['bar', 'foo']);
    });
  });

  describe('getCurrentContext()', () => {
    it('should call kubectl config', async () => {
      await getCurrentContext();
      expect(exec as jest.Mock).toHaveBeenCalledWith(
        `kubectl config view -o=jsonpath='{.current-context}'`,
      );
    });
  });
});
