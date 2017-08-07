import { FormControl } from './form-control'
import { FormControlCompositeBase } from './form-control-composite-base'
import { FormValidators, ValidationFunction } from './form-validators'

export class FormControlGroup extends FormControlCompositeBase {

    constructor(
        name: string,
        element: Element,
        private controlsConfig?: { [key: string]: any }) {
        super(name, element);

        this._addGroupControls(controlsConfig);
    }

    private _addGroupControls(controlsConfig) {

        let cfg = Object.assign({}, controlsConfig);

        Array.from(this.element.querySelectorAll('[data-formControlName]')).forEach((elem: Element) => {

            let name = elem.getAttribute('data-formControlName');
            let formControl = new FormControl(name, elem);
            let op = cfg[formControl.name];

            if (typeof op !== 'undefined') {
                if (Array.isArray(op)) {
                    let [value, validators] = op;
                    formControl.setValidator(Array.isArray(validators) ? FormValidators.compose(...validators) : <ValidationFunction>validators);
                    formControl.setValue(value);
                }
                else {
                    formControl.setValue(op);
                }
            }

            this.addControl(formControl);
        });
    }
}
