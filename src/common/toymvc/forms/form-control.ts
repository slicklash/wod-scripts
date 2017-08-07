import { ControlStatus, FormControlBase } from './form-control-base'
import { IFormControlValueProvider, FormControlValueProviderFactory } from './form-control-value-provider.factory'

export class FormControl extends FormControlBase {

    private _valueProvider: IFormControlValueProvider = undefined;

    constructor(name, element) {
        super(name, element);

        this._valueProvider = FormControlValueProviderFactory.create(this.element);

        this._valueProvider.registerOnChange(newValue => {
            this.setValue(newValue, { updateView: false });
            this.markAsDirty();
        });

        this.statusChanges.subscribe(() => {
            this._valueProvider.setDisabledState(this.isDisabled);
            this._valueProvider.setErrors(this.errors);
        });

        this._valueProvider.registerOnTouched(() => {
            this.markAsTouched();
        });
    }

    setValue(value: any, {onlySelf, emitEvent, updateView}: { onlySelf?: boolean, emitEvent?: boolean, updateView?: boolean } = { updateView: true }): void {

        if (!this.isWritable) {
            return;
        }

        this._value = value;

        if (updateView) {
            this._valueProvider.setValue(this.value);
        }

        this.updateValueAndValidity({ onlySelf, emitEvent });
    }

    reset(value: any, options?: Object): void {

        var op = Object.assign({ onlySelf: true, emitEvent: true }, typeof value === 'object' ? value : { value: value });

        if (typeof op.enumerable !== 'undefined') {
            this._isEnumerable = op.enumerable === true;
        }

        if (typeof op.writable !== 'undefined') {
            this._isWritable = op.writable === true;
        }

        if (typeof op.disabled !== 'undefined') {
            if (op.disabled) {
                this.disable(op);
            }
            else {
                this.enable(op);
            }
        }

        this.markAsPristine();
        this.markAsUntouched();

        this.setValue(op.value, op);
    }

    _updateModelValue() { }

    _resolveStatus(validationFinished?: boolean): ControlStatus {
        if (this.status === 'DISABLED') return 'DISABLED';
        if (this.errors) return 'INVALID';
        if (this.status === 'VALIDATION_PENDING' && validationFinished !== true) return 'VALIDATION_PENDING';
        return 'VALID';
    }
}
