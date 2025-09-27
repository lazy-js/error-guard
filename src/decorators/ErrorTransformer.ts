import { ErrorContextBase } from '../types/errors';
// Method decorator for async methods

export function AsyncTransform(context?: Partial<ErrorContextBase>) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            if (!this) {
                throw new Error('This is not an instance of a class');
            }
            const errorTransformer = (this as any).errorTransformer || this.constructor.prototype.errorTransformer;

            if (!errorTransformer) {
                throw new Error(
                    `ErrorTransformer not found on ${this.constructor.name}. Ensure the class has an errorTransformer property.`
                );
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
export function SyncTransform(context?: Partial<ErrorContextBase>) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            if (!this) {
                throw new Error('This is not an instance of a class');
            }
            const errorTransformer = (this as any).errorTransformer || this.constructor.prototype.errorTransformer;

            if (!errorTransformer) {
                throw new Error(
                    `ErrorTransformer not found on ${this.constructor.name}. Ensure the class has an errorTransformer property.`
                );
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
export function AutoTransform(options?: {
    exclude?: string[];
    asyncOnly?: boolean;
    defaultContext?: Partial<ErrorContextBase>;
}) {
    return function <T extends { new (...args: any[]): any }>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                this.applyAutoTransform(options);
            }

            applyAutoTransform(opts?: typeof options) {
                const exclude = opts?.exclude || ['constructor'];
                const asyncOnly = opts?.asyncOnly || false;

                const methods = Object.getOwnPropertyNames(constructor.prototype).filter(
                    (name) =>
                        !exclude.includes(name) && typeof this[name] === 'function' && name !== 'applyAutoTransform'
                );
                methods.forEach((methodName) => {
                    const originalMethod = this[methodName];
                    const isAsync = originalMethod.constructor.name === 'AsyncFunction';

                    if (asyncOnly && !isAsync) return;

                    const errorTransformer = this.errorTransformer || this.constructor.prototype.errorTransformer;

                    if (!errorTransformer) {
                        console.warn(`ErrorTransformer not found for method ${methodName} in ${this.constructor.name}`);
                        return;
                    }

                    if (isAsync) {
                        this[methodName] = errorTransformer.withAsyncTransform(originalMethod.bind(this), {
                            methodName,
                            ...opts?.defaultContext,
                        });
                    } else {
                        this[methodName] = errorTransformer.withSyncTransform(originalMethod.bind(this), {
                            methodName,
                            ...opts?.defaultContext,
                        });
                    }
                });
            }
        };
    };
}
