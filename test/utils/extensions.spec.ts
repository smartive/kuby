import '../../src/utils/extensions';

describe('util / extensions', () => {
  describe('string prototype', () => {
    describe('isBase64()', () => {
      it('should return true for base64 content', () => {
        expect('Zm9vYmFy'.isBase64()).toBe(true);
      });

      it('should return false for non base64 content', () => {
        expect('foobar'.isBase64()).toBe(false);
      });
    });

    describe('base64Encode()', () => {
      it('should correctly encode a string', () => {
        expect('foobar'.base64Encode()).toBe('Zm9vYmFy');
      });
    });

    describe('base64Decode()', () => {
      it('should correctly decode a string', () => {
        expect('Zm9vYmFy'.base64Decode()).toBe('foobar');
      });
    });
  });
});
