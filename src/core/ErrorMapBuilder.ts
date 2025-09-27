import { Constructor, ErrorContextBase } from '../types';
import { ErrorInstance } from './Error';
import { ErrorMap } from './ErrorTransformer';

interface ErrorMapBuilderOptions {
    globalProperty: string;
    rollbackError: ErrorInstance;
}

interface InputOptions {
    propertyName?: string;
}

type CustomErrorHandler = (err: any, ctx: ErrorContextBase) => Error;

interface OutputMethods {
    throwErrorInstance: (errorInstance: ErrorInstance) => ErrorMapBuilder;
    throwString: (string: string) => ErrorMapBuilder;
    throwCustomError: (handler: CustomErrorHandler) => ErrorMapBuilder;
    pass: () => ErrorMapBuilder;
}

export class ErrorMapBuilder {
    public errorMapList: ErrorMap[];
    private currentErrorMap: Partial<ErrorMap>;
    public globalProperty: string;
    public rollbackError: ErrorInstance;

    constructor(options: ErrorMapBuilderOptions) {
        this.errorMapList = [];
        this.currentErrorMap = {};
        this.globalProperty = options?.globalProperty || 'message';
        this.rollbackError = options.rollbackError;
    }

    equals(value: string, options?: InputOptions): OutputMethods {
        this.checkIfInputExists();
        this.currentErrorMap = {
            input: {
                condition: 'equals',
                message: value,
                propertyName: options?.propertyName,
            },
        };
        return this.assignOutputMethods();
    }

    oneOf(enums: string[], options?: InputOptions): OutputMethods {
        this.checkIfInputExists();

        this.currentErrorMap = {
            input: {
                condition: 'enum',
                enum: enums,
                propertyName: options?.propertyName,
            },
        };
        return this.assignOutputMethods();
    }

    matches(messageRegex: RegExp, options?: InputOptions): OutputMethods {
        this.checkIfInputExists();

        this.currentErrorMap = {
            input: {
                condition: 'matches',
                messageRegex,
                propertyName: options?.propertyName,
            },
        };
        return this.assignOutputMethods();
    }

    includes(messageParts: string[], options?: InputOptions): OutputMethods {
        this.checkIfInputExists();

        this.currentErrorMap = {
            input: {
                condition: 'includes',
                messageParts,
                propertyName: options?.propertyName,
            },
        };
        return this.assignOutputMethods();
    }

    instanceOf(constructor: Constructor): OutputMethods {
        this.checkIfInputExists();

        this.currentErrorMap = {
            input: {
                condition: 'instanceOf',
                error: constructor,
            },
        };
        return this.assignOutputMethods();
    }

    private assignOutputMethods(): OutputMethods {
        return {
            throwErrorInstance: this.throwErrorInstance.bind(this),
            throwString: this.throwString.bind(this),
            throwCustomError: this.throwCustomError.bind(this),
            pass: this.pass.bind(this),
        };
    }

    private throwErrorInstance(errorInstance: ErrorInstance): ErrorMapBuilder {
        this.currentErrorMap = {
            ...this.currentErrorMap,
            output: {
                type: 'ThrowErrorInstance',
                error: errorInstance,
            },
        };
        this.pushCurrentAndClear();
        return this;
    }

    private throwString(string: string): ErrorMapBuilder {
        this.currentErrorMap = {
            ...this.currentErrorMap,
            output: {
                type: 'ThrowString',
                string,
            },
        };
        this.pushCurrentAndClear();
        return this;
    }

    private pass(): ErrorMapBuilder {
        this.currentErrorMap = {
            ...this.currentErrorMap,
            output: {
                type: 'ThrowOriginalError',
            },
        };
        this.pushCurrentAndClear();
        return this;
    }

    private throwCustomError(handler: CustomErrorHandler): ErrorMapBuilder {
        this.currentErrorMap = {
            ...this.currentErrorMap,
            output: {
                type: 'ThrowCustomError',
                handler: (err: any, context: ErrorContextBase) => handler(err, context),
            },
        };
        this.pushCurrentAndClear();
        return this;
    }

    private pushCurrentAndClear() {
        this.errorMapList.push(this.currentErrorMap as ErrorMap);
        this.currentErrorMap = {};
    }

    public checkIfInputExists() {
        if (this.currentErrorMap.input) {
            throw new Error(
                'Incomplete mapping: Previous input was not completed. Call an output method (throwErrorInstance, throwString, etc.) before starting a new mapping.'
            );
        }
    }
}
