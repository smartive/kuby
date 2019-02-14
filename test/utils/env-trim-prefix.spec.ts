import { envTrimPrefix } from '../../src/utils/env-trim-prefix';

describe('util / envTrimPrefix', () => {
  describe('envTrimPrefix()', () => {
    beforeAll(() => {
      process.env['STA_FOO'] = 'hello foo';
      process.env['BAR'] = 'hello bar';
    });

    afterAll(() => {
      delete process.env.STA_FOO;
      delete process.env.FOO;
      delete process.env.BAR;
    });

    it('should trim prefix from env vars', () => {
      envTrimPrefix('STA_');

      expect(process.env.STA_FOO).toBe('hello foo');
      expect(process.env.FOO).toBe('hello foo');
      expect(process.env.BAR).toBe('hello bar');
    });

    it('should trim prefix from env vars and override existing vars', () => {
      process.env.FOO = 'hello existing foo';

      envTrimPrefix('STA_');
      
      expect(process.env.STA_FOO).toBe('hello foo');
      expect(process.env.FOO).toBe('hello foo');
      expect(process.env.BAR).toBe('hello bar');
    });

    it('should should not touch env vars with a nonsense prefix', () => {
      envTrimPrefix('STAXX_');
      
      expect(process.env.STA_FOO).toBe('hello foo');
      expect(process.env.FOO).toBe('hello foo');
      expect(process.env.BAR).toBe('hello bar');
    });

  });
});
