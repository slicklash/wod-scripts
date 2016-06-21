/// <reference path="../../../lib/typings/browser.d.ts" />

interface IController {
    new (): any;
}

interface IComponent {
    selector: string;
    controller: IController;
    template: string;
    directives?: IComponent[];
}

const ATTR = 'data-t';

const _ensureMetadata = $ctrl => {
    if (!$ctrl.$subscribers) Object.defineProperty($ctrl, '$subscribers', { value: {}, enumerable: false });
}

interface ParentAndKey {
    parent: any;
    key: string;
}

function getByPath (obj, path, init = undefined): ParentAndKey {
    let parent = obj;
    if (path.indexOf('{{') === 0) return { parent, key: path };
    let parts = path.split('.').slice(1);
    let key = parts[0];
    while(parts.length) {
        key = parts.shift();
        if (parts.length) {
            if (init && parent[key] === undefined) parent[key] = {};
            parent = parent[key];
        }
    }
    return { parent: parent, key: key };
}
