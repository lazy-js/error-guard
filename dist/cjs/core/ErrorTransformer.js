"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorTransformer = void 0;
class ErrorTransformer {
    constructor(config, options) {
        this.options = options;
        if (!config || !config.moduleName) {
            console.warn('moduleName is not provided, using unknown_module');
        }
        this.errorMap = config.errorMap.errorMapList;
        this.defaultError = config.errorMap.rollbackError;
        this.globalProperty = config.errorMap.globalProperty;
        this.log = (options === null || options === void 0 ? void 0 : options.log) || 'never';
        this.moduleName = (config === null || config === void 0 ? void 0 : config.moduleName) || 'unknown_module';
    }
    transform(err, patchedContext) {
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
    withAsyncTransform(wrappedMethod, patchedContext) {
        if (!wrappedMethod) {
            throw new Error('Wrapped method is required');
        }
        return async (...args) => {
            try {
                const result = await wrappedMethod.apply(this, args);
                return result;
            }
            catch (err) {
                throw this.transform(err, patchedContext);
            }
        };
    }
    withSyncTransform(wrappedMethod, patchedContext) {
        if (!wrappedMethod) {
            throw new Error('Wrapped method is required');
        }
        return (...args) => {
            try {
                const fn = wrappedMethod.apply(this, args);
                return fn;
            }
            catch (err) {
                throw this.transform(err, patchedContext);
            }
        };
    }
    normalizeError(err) {
        if (err instanceof Error) {
            return err;
        }
        if (typeof err === 'string') {
            return new Error(err);
        }
        if (err && typeof err === 'object') {
            // Try to create an error from object properties
            const message = err.message || err.code || String(err);
            return new Error(message);
        }
        return null;
    }
    getPropertyValue(err, propertyName) {
        if (!err)
            return undefined;
        const _property = propertyName || this.globalProperty;
        try {
            // Use type assertion for dynamic property access
            const errorObj = err;
            if (!errorObj[_property]) {
                return undefined;
            }
            return errorObj[_property];
        }
        catch (error) {
            return undefined;
        }
    }
    msgIncludes(err, str, propertyName) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        const message = _value === null || _value === void 0 ? void 0 : _value.toLowerCase();
        return str.every((s) => message.includes(s.toLowerCase()));
    }
    msgMatches(err, messageRegex, propertyName) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        return messageRegex.test(_value);
    }
    msgEquals(err, message, propertyName) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        return _value === message;
    }
    errorInstanceOf(err, error) {
        return err instanceof error;
    }
    errorEnum(err, enums, propertyName) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        return enums.includes(_value);
    }
    handleInput(input, err) {
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
    handleThrowOriginalErrorOutput(originalError) {
        throw originalError;
    }
    handleThrowErrorInstanceOutput(output, patchedContext, originalError) {
        if (output === 'ThrowOriginalError' || (output === null || output === void 0 ? void 0 : output.type) !== 'ThrowErrorInstance') {
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
    handleOutput(output, patchedContext, originalError) {
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
exports.ErrorTransformer = ErrorTransformer;
//# sourceMappingURL=ErrorTransformer.js.map