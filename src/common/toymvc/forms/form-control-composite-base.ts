import { ControlStatus, FormControlBase } from './form-control-base'
import { ValidationErrors } from './form-validators'

export abstract class FormControlCompositeBase extends FormControlBase {

    protected _controls: { [key: string]: FormControlBase } = {};

    constructor(
        name: string,
        element) {
        super(name, element);
    }

    get controls(): { [key: string]: FormControlBase }  { return this._controls; }

    setValue(value: any, {onlySelf, emitEvent}: { onlySelf?: boolean, emitEvent?: boolean } = {}) {

        if (!this.isWritable) {
            return;
        }

        Object.keys(value).forEach(key => {

            let ct = this._controls[key];

            if (!ct) {
                throw `FormControlCompositeBase: control "${this.name}" does not contain control "${key}"`;
            }

            ct.setValue(value[key], { onlySelf: true, emitEvent });
        });

        this.updateValueAndValidity({ onlySelf, emitEvent });
    }

    reset(formSate: any, options?: Object) {

        Object.keys(formSate).forEach(key => {

            let ct = this._controls[key];

            if (!ct) {
                throw `FormControlCompositeBase: control "${this.name}" does not contain control "${key}"`;
            }

            ct.reset(formSate[key], options);
        });

        this.updateValueAndValidity(options);

        return this;
    }

    enable({ onlySelf, emitEvent }: { onlySelf?: boolean, emitEvent?: boolean } = {}) {
        this._applyAction(x => x.enable({ onlySelf: true, emitEvent }));
        super.enable({ onlySelf, emitEvent });
    }

    disable({ onlySelf, emitEvent }: { onlySelf?: boolean, emitEvent?: boolean } = {}) {
        this._applyAction(x => x.disable({ emitEvent }));
        super.disable({ emitEvent });
    }

    addControl(formControl) {
        formControl.setParent(this);
        this._controls[formControl.name] = formControl;
    }

    setErrors(errors: { [key: string]: ValidationErrors }, options?: any) {

        let err = errors || {};
        let op = options || { emitEvent: true };

        Object.keys(this._controls).forEach(key => {
            let ct = this._controls[key];
            ct.setErrors(err[key], { emitEvent: true });
        });

        super.setErrors(errors, options);
    }

    markAsUntouched({onlySelf}: { onlySelf?: boolean } = {}): void {
        this._applyAction(x => x.markAsUntouched({ onlySelf: true }));
        super.markAsUntouched({ onlySelf });
    }

    markAsPristine({onlySelf}: { onlySelf?: boolean } = {}): void {
        this._applyAction(x => x.markAsPristine({ onlySelf: true }));
        super.markAsPristine({ onlySelf });
    }

    _updateModelValue() {
        this._value = Object.keys(this._controls).reduce((acc, key) => {
            let fc = this._controls[key];
            if (fc.isEnumerable) {
                acc[key] = fc.value;
            }
            return acc;
        }, {});
    }

    _resolveStatus(validationFinished?: boolean): ControlStatus {
        if (this._allControls(x => x.status === 'DISABLED')) return 'DISABLED';
        if (this.errors) return 'INVALID';
        if (this._anyControl(x => x.status === 'INVALID')) return 'INVALID';
        if (this._anyControl(x => x.status === 'VALIDATION_PENDING')) return 'VALIDATION_PENDING';
        return 'VALID';
    }

    protected _applyAction(action: (control: FormControlBase) => void) {
        Object.keys(this._controls).forEach(key => {
            let ct = this._controls[key];
            if (ct.isEnumerable) action(ct);
        });
    }

    protected _anyControl(condition: (control: FormControlBase) => boolean): boolean {

        let keys = Object.keys(this._controls);

        for (let key of keys) {
            let ct = this._controls[key];
            if (ct.isEnumerable && condition(ct)) return true;
        }

        return false;
    }

    protected _allControls(condition: (control: FormControlBase) => boolean): boolean {

        let keys = Object.keys(this._controls);

        for (let key of keys) {
            let ct = this._controls[key];
            if (ct.isEnumerable && !condition(ct)) return false;
        }

        return true;
    }
}
