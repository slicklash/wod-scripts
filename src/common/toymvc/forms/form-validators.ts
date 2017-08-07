import { FormControlBase } from 'form-control-base'

export type ValidationFunction = (control: FormControlBase) => Promise<ValidationErrors>;

export type ValidationErrors = { [key: string]: any };

export class FormValidators {

    static compose(...args: ValidationFunction[]): ValidationFunction {

        return function (control: FormControlBase): Promise<ValidationErrors> {

            return Promise.all(args.map(validateFn => validateFn(control))).then(results => {
                for (let i = 0; i < results.length; i++) {
                    let errors = results[i];
                    if (errors) return Promise.resolve(<any>errors);
                }
                return Promise.resolve(null);
            });
        };
    }

    static required(message: string): ValidationFunction {

        if (!message) throw 'FormValidators: message is required';

        return function (control: FormControlBase) {
            return isEmptyInputValue(control.value) ? Promise.resolve({ required: message }) : Promise.resolve(null);
        }
    }

    static pattern(pattern: string | RegExp, message: string): ValidationFunction {

        if (!message) throw 'FormValidators: message is required';

        if (!pattern) return FormValidators.nullValidator;

        var regex: RegExp;

        if (typeof pattern === 'string') {
            if (!(<string>pattern).startsWith('^')) pattern = '^' + pattern;
            if (!(<string>pattern).endsWith('$')) pattern += '$';
            regex = new RegExp(<string>pattern);
        }
        else {
            regex = <RegExp>pattern;
        }

        let regexStr = regex.toString();

        return function (control) {

            let value = control.value;

            return isEmptyInputValue(value) || regex.test(value) ? Promise.resolve(null) : Promise.resolve({
                pattern: {
                    message: message,
                    requiredPattern: regexStr,
                    actualValue: value
                }
            });
        };
    }

    static nullValidator(control: FormControlBase): Promise<ValidationErrors> {
        return Promise.resolve(null);
    }
}

function isEmptyInputValue(value) {
    return value == null || value.length === 0;
}
