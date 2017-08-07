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

    static create(element): IFormControlValueProvider {
        let valAcc = new DefaultValueProvider();
        valAcc.init(element);
        return valAcc;
    }
}

class DefaultValueProvider implements IFormControlValueProvider {

    element: any;
    private _value: any;

    init(element) {
        this.element = element;
        this._value = element.val();
    }

    setValue(value) {
        this._value = value;
        this.element.val(value);
    }

    getValue() {
        return this._value;
    }

    setDisabledState(isDisabled) {
        this.element.enable(isDisabled === false);
    }

    registerOnChange(fn) {
        this.element.on('change', () => {
            this._value = this.element.val();
            fn(this._value);
        });
    }

    registerOnTouched(fn) {
        this.element.on('blur', fn);
    }

    setErrors(errors: ValidationErrors) {
        throw 'Not implemented'

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
