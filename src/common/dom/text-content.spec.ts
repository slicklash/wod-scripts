import { textContent } from './text-content';

describe('common / functions / dom / textContent', () => {

    it('should read element text', () => {
        const div = document.createElement('div');
        div.textContent = 'test';

        expect(textContent(div)).toBe('test');
    });

    it('should set element text', () => {
        const div = document.createElement('div');
        textContent(div, 'test');

        expect(div.textContent).toBe('test');
    });

    it('should return empty of invalid element', () => {
        expect(textContent(null)).toBe('');
    });
});
