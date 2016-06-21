
class ToyController {

    toy: any = { name: 'toy default' };
    name: string = 'default';

    $onInit() {

    }

    onGenerate() {
        this.toy.name = 'new name';
        this.name = 'mp new name';
    }

    onChange() {}
    onChangeName() {}
}
