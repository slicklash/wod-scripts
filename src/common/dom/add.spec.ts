import { add } from './add';

describe('common / functions / dom / add', () => {

    it('should create div element', () => {
        const el = add<HTMLDivElement>('div');
        expect(el.tagName).toBe('DIV');
    });

    it('should create DIV element and add it to parent', () => {
        const parent = document.createElement('div');
        const el = add<HTMLDivElement>('div', parent);

        expect(el.parentNode).toBe(parent);
    });

    it('should add existing element to parent', () => {
        const el = document.createElement('div');
        const parent = document.createElement('div');
        const sut = add<any>(el, parent);

        expect(sut).toBe(el);

        expect(sut.parentNode).toBe(parent);
    });
});
