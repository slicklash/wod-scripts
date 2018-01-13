
export function waitFor(selectorOrElement: string | Element | Document, eventName?: string): Promise<any> {

    return new Promise(resolve => {

        if (typeof selectorOrElement === 'string') {

            const fn = () => {

                const elem = document.querySelector(selectorOrElement);

                if (elem || document.readyState === 'complete') resolve(elem);

                setTimeout(fn, 25);
            };

            fn();
        } else {
            selectorOrElement.addEventListener(eventName, resolve);
        }
    });
}
