// Method decorator for async methods
export function AsyncTransform(context) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            if (!this) {
                throw new Error('This is not an instance of a class');
            }
            const errorTransformer = this.errorTransformer || this.constructor.prototype.errorTransformer;
            if (!errorTransformer) {
                throw new Error(`ErrorTransformer not found on ${this.constructor.name}. Ensure the class has an errorTransformer property.`);
            }
            const wrappedMethod = errorTransformer.withAsyncTransform(originalMethod.bind(this), {
                methodName: propertyKey,
                ...context,
            });
            return await wrappedMethod(...args);
        };
        return descriptor;
    };
}
// Method decorator for sync methods
export function SyncTransform(context) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            if (!this) {
                throw new Error('This is not an instance of a class');
            }
            const errorTransformer = this.errorTransformer || this.constructor.prototype.errorTransformer;
            if (!errorTransformer) {
                throw new Error(`ErrorTransformer not found on ${this.constructor.name}. Ensure the class has an errorTransformer property.`);
            }
            const wrappedMethod = errorTransformer.withSyncTransform(originalMethod.bind(this), {
                methodName: propertyKey,
                ...context,
            });
            return wrappedMethod(...args);
        };
        return descriptor;
    };
}
// Class decorator to auto-transform all methods
export function AutoTransform(options) {
    return function (constructor) {
        return class extends constructor {
            constructor(...args) {
                super(...args);
                this.applyAutoTransform(options);
            }
            applyAutoTransform(opts) {
                const exclude = (opts === null || opts === void 0 ? void 0 : opts.exclude) || ['constructor'];
                const asyncOnly = (opts === null || opts === void 0 ? void 0 : opts.asyncOnly) || false;
                const methods = Object.getOwnPropertyNames(constructor.prototype).filter((name) => !exclude.includes(name) && typeof this[name] === 'function' && name !== 'applyAutoTransform');
                methods.forEach((methodName) => {
                    const originalMethod = this[methodName];
                    const isAsync = originalMethod.constructor.name === 'AsyncFunction';
                    if (asyncOnly && !isAsync)
                        return;
                    const errorTransformer = this.errorTransformer || this.constructor.prototype.errorTransformer;
                    if (!errorTransformer) {
                        console.warn(`ErrorTransformer not found for method ${methodName} in ${this.constructor.name}`);
                        return;
                    }
                    if (isAsync) {
                        this[methodName] = errorTransformer.withAsyncTransform(originalMethod.bind(this), {
                            methodName,
                            ...opts === null || opts === void 0 ? void 0 : opts.defaultContext,
                        });
                    }
                    else {
                        this[methodName] = errorTransformer.withSyncTransform(originalMethod.bind(this), {
                            methodName,
                            ...opts === null || opts === void 0 ? void 0 : opts.defaultContext,
                        });
                    }
                });
            }
        };
    };
}
//# sourceMappingURL=ErrorTransformer.js.map