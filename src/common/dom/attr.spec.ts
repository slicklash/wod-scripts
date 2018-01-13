import { attr } from './attr';

describe('common / functions / dom / attr', () => {

    it('should set single attribute and return same element', () => {
        const el = document.createElement('div');
        const r = attr(el, 'id', 'test');
        const val = el.getAttribute('id');

        expect(val).toBe('test');
        expect(r).toBe(el);
    });

    it('should read single attribute', () => {
        const el = document.createElement('div');
        el.setAttribute('id', 'test');

        const val = attr(el, 'id');

        expect(val).toBe('test');
    });

    it('should set multiple attributes', () => {
        const div = document.createElement('div');
        const el = attr(div, {id: 'id', class: 'classx'});
        const id = el.getAttribute('id');
        const classx = el.getAttribute('class');

        expect(id).toBe('id');
        expect(classx).toBe('classx');
        expect(el).toBe(div);
    });

    it('should remove single attribute', () => {
        const div = document.createElement('div');
        div.setAttribute('id', 'test');

        const el = attr(div, 'id', 'aa', true);

        expect(el.getAttribute('id')).toBeNull();
        expect(el).toBe(div);
    });
});
