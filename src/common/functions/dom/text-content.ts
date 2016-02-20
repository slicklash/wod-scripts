
const textContent = (elem, value?) => {

    if (!elem) return '';

    if (typeof value === 'undefined') {
        return elem.textContent;
    }

    elem.textContent = value;
};
