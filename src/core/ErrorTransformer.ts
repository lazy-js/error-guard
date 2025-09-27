import { ErrorConstructorEnum, ErrorConstructorType } from '../enums';
import { ErrorInstance } from './Error';
import { ErrorMapBase, ErrorMapOutBase, ErrorMapInputBase, Constructor } from '../types/transformer';
import { ErrorContextBase } from '../types/errors';
import { ErrorMapBuilder } from './ErrorMapBuilder';

export type ErrorMap = ErrorMapBase<ErrorInstance, ErrorConstructorEnum | ErrorConstructorType>;
export type ErrorMapOut = ErrorMapOutBase<ErrorInstance, ErrorConstructorEnum | ErrorConstructorType>;
export type ErrorMapInput = ErrorMapInputBase;

export type ErrorTransformerLogLevels = 'unknown' | 'known' | 'all' | 'never';

// Type for error input that can be transformed
export type ErrorInput = Error | string | null | undefined | Record<string, unknown>;

interface ErrorTransformerOptions {
    log?: ErrorTransformerLogLevels;
}

interface ErrorTranformerConfig {
    errorMap: ErrorMapBuilder;
    moduleName?: string;
}

export class ErrorTransformer {
    private errorMap: ErrorMap[];
    private defaultError: ErrorInstance;
    private globalProperty: string;
    private log: ErrorTransformerLogLevels;
    private moduleName: string;
    constructor(config: ErrorTranformerConfig, public options?: ErrorTransformerOptions) {
        if (!config || !config.moduleName) {
            console.warn('moduleName is not provided, using unknown_module');
        }
        this.errorMap = config.errorMap.errorMapList;
        this.defaultError = config.errorMap.rollbackError;

        this.globalProperty = config.errorMap.globalProperty;
        this.log = options?.log || 'never';
        this.moduleName = config?.moduleName || 'unknown_module';
    }

    transform(err: ErrorInput, patchedContext: ErrorContextBase): never {
        if (typeof this.defaultError !== 'string') {
            this.defaultError.updateContext({
                ...patchedContext,
                originalError: this.normalizeError(err) || new Error('Unknown error'),
            });

            this.defaultError.updateTimestampToNow();
        }

        const normalizedError = this.normalizeError(err);
        if (!normalizedError || !this.getPropertyValue(normalizedError, this.globalProperty)) {
            throw this.defaultError;
        }

        for (const error of this.errorMap) {
            if (this.handleInput(error.input, normalizedError)) {
                this.handleOutput(error.output, patchedContext, normalizedError);
            }
        }

        if (this.log === 'all' || this.log === 'unknown') {
            if (typeof this.defaultError !== 'string') {
                this.defaultError.log();
            }
        }
        throw this.defaultError;
    }

    withAsyncTransform<TArgs extends readonly unknown[], TReturn>(
        wrappedMethod: (...args: TArgs) => Promise<TReturn>,
        patchedContext: ErrorContextBase
    ): (...args: TArgs) => Promise<TReturn> {
        if (!wrappedMethod) {
            throw new Error('Wrapped method is required');
        }
        return async (...args: TArgs) => {
            try {
                const result = await wrappedMethod.apply(this, args as any);
                return result;
            } catch (err: any) {
                throw this.transform(err, patchedContext);
            }
        };
    }

    withSyncTransform<TArgs extends readonly unknown[], TReturn>(
        wrappedMethod: (...args: TArgs) => TReturn,
        patchedContext: ErrorContextBase
    ): (...args: TArgs) => TReturn {
        if (!wrappedMethod) {
            throw new Error('Wrapped method is required');
        }
        return (...args: TArgs) => {
            try {
                const fn = wrappedMethod.apply(this, args as any);
                return fn as TReturn;
            } catch (err: any) {
                throw this.transform(err, patchedContext);
            }
        };
    }

    private normalizeError(err: ErrorInput): Error | null {
        if (err instanceof Error) {
            return err;
        }
        if (typeof err === 'string') {
            return new Error(err);
        }
        if (err && typeof err === 'object') {
            // Try to create an error from object properties
            const message = (err as any).message || (err as any).code || String(err);
            return new Error(message);
        }
        return null;
    }

    private getPropertyValue(err: Error | null, propertyName?: string) {
        if (!err) return undefined;

        const _property = propertyName || this.globalProperty;
        try {
            // Use type assertion for dynamic property access
            const errorObj = err as any;
            if (!errorObj[_property]) {
                return undefined;
            }
            return errorObj[_property];
        } catch (error) {
            return undefined;
        }
    }
    private msgIncludes(err: Error | null, str: string[], propertyName?: string) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        const message = _value?.toLowerCase();
        return str.every((s) => message.includes(s.toLowerCase()));
    }

    private msgMatches(err: Error | null, messageRegex: RegExp, propertyName?: string) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        return messageRegex.test(_value);
    }

    private msgEquals(err: Error | null, message: string, propertyName?: string) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        return _value === message;
    }

    private errorInstanceOf(err: Error | null, error: Constructor<any>) {
        return err instanceof error;
    }

    private errorEnum(err: Error | null, enums: string[], propertyName?: string) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        return enums.includes(_value);
    }

    private handleInput(input: ErrorMapInput, err: Error | null) {
        switch (input.condition) {
            case 'includes':
                return this.msgIncludes(err, input.messageParts, input.propertyName);
            case 'matches':
                return this.msgMatches(err, input.messageRegex, input.propertyName);
            case 'equals':
                return this.msgEquals(err, input.message, input.propertyName);
            case 'instanceOf':
                return this.errorInstanceOf(err, input.error);
            case 'enum':
                return this.errorEnum(err, input.enum, input.propertyName);
            default:
                return false;
        }
    }

    private handleThrowOriginalErrorOutput(originalError: Error | null): never {
        throw originalError;
    }

    private handleThrowErrorInstanceOutput(
        output: ErrorMapOut,
        patchedContext: ErrorContextBase,
        originalError: Error | null
    ): never {
        if (output === 'ThrowOriginalError' || output?.type !== 'ThrowErrorInstance') {
            throw new Error('Output type is not ThrowErrorInstance');
        }

        let error = output.error;
        const newContext = {
            ...error.context,
            ...patchedContext,
            transformerModuleName: this.moduleName,
            originalError: originalError || new Error('Unknown error'),
        };
        error.updateContext(newContext);
        // handle log
        if (this.log === 'all' || this.log === 'known') {
            error.log();
        }

        throw error;
    }

    private handleOutput(output: ErrorMapOut, patchedContext: ErrorContextBase, originalError: Error | null): never {
        // handle pass action
        if (output === 'ThrowOriginalError' || output.type === 'ThrowOriginalError') {
            this.handleThrowOriginalErrorOutput(originalError);
        }

        // handle error instance action
        if (output.type === 'ThrowErrorInstance') {
            this.handleThrowErrorInstanceOutput(output, patchedContext, originalError);
        }

        // handle custom error action
        if (output.type === 'ThrowCustomError') {
            throw output.handler(originalError, {
                ...patchedContext,
                transformerModuleName: this.moduleName,
            });
        }

        // handle string action
        if (this.log === 'all' || this.log === 'known') {
            console.log(output.string);
        }
        throw output.string;
    }
}
