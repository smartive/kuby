import { RcFile } from '../../src/utils/rc-file';

describe('util / rc-file', () => {
  it('should add context arguments if set', () => {
    expect(
      RcFile.getKubectlCtxArguments({ context: 'foobar' } as any, []),
    ).toEqual(['--context', 'foobar']);
  });

  it('should add namespace arguments if set', () => {
    expect(
      RcFile.getKubectlNsArguments({ namespace: 'foobar' } as any, []),
    ).toEqual(['--namespace', 'foobar']);
  });

  it('should add kubectl arguments if set', () => {
    expect(
      RcFile.getKubectlArguments({ context: 'ctx', namespace: 'ns' } as any, []),
    ).toEqual(['--namespace', 'ns', '--context', 'ctx']);
  });
});
