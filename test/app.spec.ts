import { helloThere } from '../src/app';

describe('Testing', () => {

    it('is important!', () => {
        expect(helloThere()).toBe('hello typescript!');
    });

});
