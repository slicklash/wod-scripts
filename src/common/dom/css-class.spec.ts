import { cssClass } from './css-class';

describe('common / functions / dom / cssClass', () => {

    it('should return false if element has no class', () => {
        const el = document.createElement('div');
        el.className = 'testClass';

        const has = cssClass(el, 'test');

        expect(has).toBeFalsy();
    });

    it('should return true if element has class', () => {
        const el = document.createElement('div');
        el.className = 'testClass test';

        const has = cssClass(el, 'test');

        expect(has).toBeTruthy();
    });

    it('should toggle off class', () => {
        const div = document.createElement('div');
        div.className = 'testClass test';

        const el = cssClass(div, 'test', false);

        expect(div.className).toBe('testClass');
        expect(el).toBe(div);
    });

    it('should toggle on class', () => {
        const div = document.createElement('div');
        div.className = 'testClass';

        const el = cssClass(div, 'test', true);

        expect(div.className).toBe('testClass test');
        expect(el).toBe(div);
    });

    it('should do nothing is class exists', () => {
        const div = document.createElement('div');
        div.className = 'testClass test';

        const el = cssClass(div, 'test', true);

        expect(div.className).toBe('testClass test');
        expect(el).toBe(div);
    });
});
