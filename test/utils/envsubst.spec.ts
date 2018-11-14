import { datasubst, envsubst } from '../../src/utils/envsubst';

describe('util / envsubst', () => {
  describe('envsubst()', () => {
    beforeAll(() => {
      process.env['FOOBAR'] = 'hello world';
    });

    afterAll(() => {
      delete process.env.FOOBAR;
    });

    it('should replace an environment variable with ${NAME}', () => {
      expect(envsubst('This content: ${FOOBAR}')).toBe(
        'This content: hello world',
      );
    });

    it('should replace an environment variable with $NAME', () => {
      expect(envsubst('This content: $FOOBAR')).toBe(
        'This content: hello world',
      );
    });

    it('should not replace a variable if not present for ${NAME}', () => {
      expect(envsubst('This content: ${FOO}')).toBe('This content: ${FOO}');
    });

    it('should not replace a variable if not present for $NAME', () => {
      expect(envsubst('This content: $FOO')).toBe('This content: $FOO');
    });
  });
  describe('datasubst()', () => {
    it('should replace a data element variable with ${NAME}', () => {
      expect(
        datasubst('This content: ${FOOBAR}', { FOOBAR: 'hello world' }),
      ).toBe('This content: hello world');
    });

    it('should replace a data element variable with $NAME', () => {
      expect(
        datasubst('This content: $FOOBAR', { FOOBAR: 'hello world' }),
      ).toBe('This content: hello world');
    });

    it('should not replace a data element variable if not present for ${NAME}', () => {
      expect(datasubst('This content: ${FOOBAR}', {})).toBe(
        'This content: ${FOOBAR}',
      );
    });

    it('should not replace a data element variable if not present for $NAME', () => {
      expect(datasubst('This content: $FOOBAR', {})).toBe(
        'This content: $FOOBAR',
      );
    });
  });
});
