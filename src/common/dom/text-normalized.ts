import { textContent } from './text-content';

export function textNormalized(x) {
    return textContent(x).trim().split(/\s+/).join(' ');
}
