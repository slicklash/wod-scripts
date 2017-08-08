import { IEventEmitter, IObservable, EventEmitter } from '../event-emitter'
import { ValidationFunction, ValidationErrors } from './form-validators'

export type ControlStatus = 'VALID' | 'INVALID' | 'VALIDATION_PENDING' | 'DISABLED';

export abstract class FormControlBase {

    protected _value = undefined;

    protected _isEnumerable: boolean = true;
    protected _isWritable: boolean = true;

    private _status: ControlStatus = 'VALID';
    private _isPristine: boolean = true;
    private _isTouched: boolean = false;

    private _valueChanges: IEventEmitter = undefined;
    private _statusChanges: IEventEmitter = undefined;

    private _validator: ValidationFunction = undefined;
    private _errors: ValidationErrors = undefined;

    private _parent: FormControlBase = undefined;

    constructor(public name, public element: Element) {
        this._valueChanges = new EventEmitter('valueChanges');
        this._statusChanges = new EventEmitter('statusChanges');
    }

    setParent(parent: FormControlBase) {
        this._parent = parent;
    }

    get parent(): FormControlBase { return this._parent; }

    get value(): any { return this._value; }

    get isWritable(): boolean { return this._isWritable; }
    get isEnumerable(): boolean { return this._isEnumerable; }

    get status(): ControlStatus { return this._status; }

    get isEnabled(): boolean { return this._status !== 'DISABLED'; }
    get isDisabled(): boolean { return this._status === 'DISABLED'; }

    get isValid(): boolean { return this._status === 'VALID'; }
    get isInvalid(): boolean { return this._status === 'INVALID'; }

    get isValidationPending(): boolean { return this._status === 'VALIDATION_PENDING'; }

    get isTouched(): boolean { return this._isTouched; }
    get isUntouched(): boolean { return !this._isTouched; }

    get isPrisine(): boolean { return this._isPristine; }
    get isDirty(): boolean { return !this._isPristine; }

    get valueChanges(): IObservable { return this._valueChanges; }
    get statusChanges(): IObservable { return this._statusChanges; }

    get errors(): any { return this._status !== 'DISABLED' ? this._errors : null; }

    abstract setValue(value: any, options?: Object): void;

    abstract reset(formState?: any, options?: Object): void;

    protected abstract _updateModelValue(): void;

    protected abstract _resolveStatus(validationFinished?: boolean): ControlStatus;

    updateValueAndValidity({ onlySelf, emitEvent }: { onlySelf?: boolean, emitEvent?: boolean } = {}) {

        this._status = this._resolveStatus();
        this._updateModelValue();

        this._runValidator().then(() => {

            if (emitEvent !== false) {
                this._valueChanges.emit(this._value);
                this._emitStatus();
            }

            if (this._parent && !onlySelf) {
                this._parent.updateValueAndValidity({ onlySelf, emitEvent });
            }
        });
    }

    protected _emitStatus() {
        this._statusChanges.emit(this._status);
    }

    markAsTouched({onlySelf}: { onlySelf?: boolean } = {}) {

        if (!this._isWritable) {
            return;
        }

        this._isTouched = true;

        if (this._parent && !onlySelf) {
            this._parent.markAsTouched({ onlySelf });
        }
    }

    markAsUntouched({onlySelf}: { onlySelf?: boolean } = {}): void {

        if (!this._isWritable) {
            return;
        }

        this._isTouched = false;

        if (this._parent && !onlySelf) {
            this._parent.markAsUntouched({ onlySelf });
        }
    }

    markAsDirty({onlySelf}: { onlySelf?: boolean } = {}) {

        if (!this._isWritable) {
            return;
        }

        this._isPristine = false;

        if (this._parent && !onlySelf) {
            this._parent.markAsDirty({ onlySelf });
        }
    }

    markAsPristine({onlySelf}: { onlySelf?: boolean } = {}): void {

        if (!this._isWritable) {
            return;
        }

        this._isPristine = true;

        if (this._parent && !onlySelf) {
            this._parent.markAsPristine({ onlySelf });
        }
    }

    enable({ onlySelf, emitEvent }: { onlySelf?: boolean, emitEvent?: boolean } = {}) {
        this._status = 'VALID';
        this.updateValueAndValidity({ onlySelf: true, emitEvent });
    }

    disable({ emitEvent }: { emitEvent?: boolean } = {}) {
        this._status = 'DISABLED';
        if (emitEvent !== false) {
            this._emitStatus();
        }
    }

    setValidator(validator: ValidationFunction) { this._validator = validator; }

    clearValidator() { this._validator = null; }

    private _runValidator(): Promise<any> {

        if (this._status !== 'DISABLED' && this._validator) {
            this._status = 'VALIDATION_PENDING';
            return this._validator(this).then(errors => {
                this._errors = errors;
                this._status = this._resolveStatus(true);
            });
        }

        return Promise.resolve(null);
    }

    setErrors(errors: ValidationErrors, { emitEvent }: { emitEvent?: boolean } = {}) {
        this._errors = errors;
        this._status = this._resolveStatus();
        if (emitEvent !== false) {
            this._emitStatus();
        }
    }
}
