import { FormControlGroup } from './form-control-group'

export class FormBuilder {

    static group(formGroupName: string, container: Element, controlsConfig: { [key: string]: any }) {

        let selector = `[data-formGroupName="${formGroupName}"]`;
        let element = container ? (container.getAttribute('data-formGroupName') === formGroupName ? container : container.querySelector(selector)) : document.querySelector(selector);

        return new FormControlGroup(formGroupName, element, controlsConfig);
    }
}
