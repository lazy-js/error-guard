"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMapBuilder = void 0;
class ErrorMapBuilder {
    constructor(options) {
        this.errorMapList = [];
        this.currentErrorMap = {};
        this.globalProperty = (options === null || options === void 0 ? void 0 : options.globalProperty) || 'message';
        this.rollbackError = options.rollbackError;
    }
    equals(value, options) {
        this.checkIfInputExists();
        this.currentErrorMap = {
            input: {
                condition: 'equals',
                message: value,
                propertyName: options === null || options === void 0 ? void 0 : options.propertyName,
            },
        };
        return this.assignOutputMethods();
    }
    oneOf(enums, options) {
        this.checkIfInputExists();
        this.currentErrorMap = {
            input: {
                condition: 'enum',
                enum: enums,
                propertyName: options === null || options === void 0 ? void 0 : options.propertyName,
            },
        };
        return this.assignOutputMethods();
    }
    matches(messageRegex, options) {
        this.checkIfInputExists();
        this.currentErrorMap = {
            input: {
                condition: 'matches',
                messageRegex,
                propertyName: options === null || options === void 0 ? void 0 : options.propertyName,
            },
        };
        return this.assignOutputMethods();
    }
    includes(messageParts, options) {
        this.checkIfInputExists();
        this.currentErrorMap = {
            input: {
                condition: 'includes',
                messageParts,
                propertyName: options === null || options === void 0 ? void 0 : options.propertyName,
            },
        };
        return this.assignOutputMethods();
    }
    instanceOf(constructor) {
        this.checkIfInputExists();
        this.currentErrorMap = {
            input: {
                condition: 'instanceOf',
                error: constructor,
            },
        };
        return this.assignOutputMethods();
    }
    assignOutputMethods() {
        return {
            throwErrorInstance: this.throwErrorInstance.bind(this),
            throwString: this.throwString.bind(this),
            throwCustomError: this.throwCustomError.bind(this),
            pass: this.pass.bind(this),
        };
    }
    throwErrorInstance(errorInstance) {
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
    throwString(string) {
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
    pass() {
        this.currentErrorMap = {
            ...this.currentErrorMap,
            output: {
                type: 'ThrowOriginalError',
            },
        };
        this.pushCurrentAndClear();
        return this;
    }
    throwCustomError(handler) {
        this.currentErrorMap = {
            ...this.currentErrorMap,
            output: {
                type: 'ThrowCustomError',
                handler: (err, context) => handler(err, context),
            },
        };
        this.pushCurrentAndClear();
        return this;
    }
    pushCurrentAndClear() {
        this.errorMapList.push(this.currentErrorMap);
        this.currentErrorMap = {};
    }
    checkIfInputExists() {
        if (this.currentErrorMap.input) {
            throw new Error('Incomplete mapping: Previous input was not completed. Call an output method (throwErrorInstance, throwString, etc.) before starting a new mapping.');
        }
    }
}
exports.ErrorMapBuilder = ErrorMapBuilder;
//# sourceMappingURL=ErrorMapBuilder.js.map