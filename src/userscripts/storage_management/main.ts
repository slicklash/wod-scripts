import { StorageController } from './storage-controller'

function main() {

    if (document.querySelector('[name^="LocationEquip"]'))
        return;

    setTimeout(() => { new StorageController().$onInit() }, 0);
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
