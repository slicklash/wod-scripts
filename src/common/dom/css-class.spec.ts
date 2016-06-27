import { cssClass } from './css-class'

describe('common / functions / dom / cssClass', () => {

    it('should return false if element has no class', () => {

        let el = document.createElement('div');
        el.className = 'testClass';

        let has = cssClass(el, 'test');

        expect(has).toBeFalsy();

    })

    it('should return true if element has class', () => {

        let el = document.createElement('div');
        el.className = 'testClass test';

        let has = cssClass(el, 'test');

        expect(has).toBeTruthy();

    })

    it('should toggle off class', () => {

        let div = document.createElement('div');
        div.className = 'testClass test';

        let el = cssClass(div, 'test', false);

        expect(div.className).toBe('testClass');
        expect(el).toBe(div);

    })

    it('should toggle on class', () => {

        let div = document.createElement('div');
        div.className = 'testClass';

        let el = cssClass(div, 'test', true);

        expect(div.className).toBe('testClass test');
        expect(el).toBe(div);

    })

    it('should do nothing is class exists', () => {

        let div = document.createElement('div');
        div.className = 'testClass test';

        let el = cssClass(div, 'test', true);

        expect(div.className).toBe('testClass test');
        expect(el).toBe(div);

    })

})
