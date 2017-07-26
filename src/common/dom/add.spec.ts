import { add } from  './add'

describe('common / functions / dom / add', () => {

    it('should create div element', () => {

        let el = add<HTMLDivElement>('div')
        expect(el.tagName).toBe('DIV')

    })


    it('should create DIV element and add it to parent', () => {

        var parent = document.createElement('div'), 
            el = add<HTMLDivElement>('div', parent);

        expect(el.parentNode).toBe(parent);

    })


    it('should add existing element to parent', () => {

        var el = document.createElement('div'),
            parent = document.createElement('div'),
            sut = add<any>(el, parent);

        expect(sut).toBe(el);

        expect(sut.parentNode).toBe(parent);

    })

})

