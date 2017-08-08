import { ValidationErrors } from './form-validators'

export interface IFormControlValueProvider {
    setValue(obj);
    getValue(): any;
    setDisabledState(isDisabled: boolean);
    setErrors(errors: ValidationErrors);
    registerOnChange(fn: Function);
    registerOnTouched(fn: Function);
}

export class FormControlValueProviderFactory {

    static create(element: Element): IFormControlValueProvider {
        return new DefaultValueProvider().init(element);
    }
}

class DefaultValueProvider implements IFormControlValueProvider {

    element: HTMLInputElement;
    private _value: any;

    init(element): DefaultValueProvider {
        this.element = element;
        this._value = element.value;
        return this;
    }

    setValue(value) {
        this._value = value;
        this.element.value = value;
    }

    getValue() {
        return this._value;
    }

    setDisabledState(isDisabled) {
        this.element.disabled = isDisabled === true;
    }

    registerOnChange(fn) {
        this.element.addEventListener('change', () => {
            this._value = this.element.value;
            fn(this._value);
        });
    }

    registerOnTouched(fn) {
        this.element.addEventListener('blur', fn);
    }

    setErrors(errors: ValidationErrors) {

        console.log('Error', errors);

        // throw 'Not implemented'

        /*
        let $parent = this.element.parents('.control-group');
        let $validationError = this.element.next();
        let hasError = $validationError.is('.validation-error');

        if (errors) {
            $parent.addClass('has-error');
            if (!hasError) {
                $validationError = $('<div class="validation-error"><span class="validation-error__message"></span></div>');
                this.element.after($validationError);
            }
            var error = errors[Object.keys(errors)[0]];
            $validationError.children().text(typeof error === 'string' ? error : error.message);
        }
        else {
            $parent.removeClass('has-error');
            if (hasError) {
                $validationError.remove();
            }
        }
        */
    }
}
