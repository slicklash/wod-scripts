/// <reference path="../../../_references.spec.ts" />

/// <reference path="attr.ts" />

describe('common / functions / dom / attr', () => {

    it('should set single attribute and return same element', () => {

        let el = document.createElement('div');

        let r = attr(el, 'id', 'test');

        let val = el.getAttribute('id');

        expect(val).toBe('test');
        expect(r).toBe(el);

    });

    it('should read single attribute', () => {

        let el = document.createElement('div');
        el.setAttribute('id', 'test');

        let val = attr(el, 'id');

        expect(val).toBe('test');

    });

    it('should set multiple attributes', () => {

        let div = document.createElement('div');

        let el = attr(div, {'id': 'id', 'class': 'classx'});

        let id = el.getAttribute('id'),
            classx = el.getAttribute('class');

        expect(id).toBe('id');
        expect(classx).toBe('classx');
        expect(el).toBe(div);

    });

    it('should remove single attribute', () => {

        let div = document.createElement('div');
        div.setAttribute('id', 'test');

        let el = attr(div, 'id', 'aa', true);

        expect(el.getAttribute('id')).toBeNull();
        expect(el).toBe(div);

    });

});

