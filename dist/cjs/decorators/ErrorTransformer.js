"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncTransform = AsyncTransform;
exports.SyncTransform = SyncTransform;
exports.AutoTransform = AutoTransform;
/**
 * Method decorator that wraps async methods with error transformation capabilities.
 *
 * This decorator automatically catches errors thrown by the decorated async method,
 * transforms them using the class's errorTransformer, and provides enhanced error
 * context including method name and custom context data.
 *
 * @param context - Optional context data to include in error transformations
 * @returns A method decorator function
 *
 * @example
 * ```typescript
 * class UserService {
 *   errorTransformer = new ErrorTransformer();
 *
 *   @AsyncTransform({ layer: 'SERVICE', className: 'UserService' })
 *   async getUserById(id: string): Promise<User> {
 *     const user = await this.userRepository.findById(id);
 *     if (!user) {
 *       throw new Error('User not found');
 *     }
 *     return user;
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * class ApiController {
 *   errorTransformer = new ErrorTransformer();
 *
 *   @AsyncTransform({
 *     layer: 'CONTROLLER',
 *     transformerModuleName: 'api-controller'
 *   })
 *   async createUser(@Body() userData: CreateUserDto): Promise<User> {
 *     return await this.userService.createUser(userData);
 *   }
 * }
 * ```
 *
 * @throws {Error} When the method is not called on a class instance
 * @throws {Error} When errorTransformer is not found on the class
 *
 * @since 1.0.0
 */
function AsyncTransform(context) {
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
/**
 * Method decorator that wraps synchronous methods with error transformation capabilities.
 *
 * This decorator automatically catches errors thrown by the decorated synchronous method,
 * transforms them using the class's errorTransformer, and provides enhanced error
 * context including method name and custom context data.
 *
 * @param context - Optional context data to include in error transformations
 * @returns A method decorator function
 *
 * @example
 * ```typescript
 * class ValidationService {
 *   errorTransformer = new ErrorTransformer();
 *
 *   @SyncTransform({ layer: 'SERVICE', className: 'ValidationService' })
 *   validateEmail(email: string): boolean {
 *     if (!email.includes('@')) {
 *       throw new Error('Invalid email format');
 *     }
 *     return true;
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * class DataProcessor {
 *   errorTransformer = new ErrorTransformer();
 *
 *   @SyncTransform({
 *     layer: 'UTILITY',
 *     transformerModuleName: 'data-processor'
 *   })
 *   processData(data: any[]): ProcessedData[] {
 *     if (!Array.isArray(data)) {
 *       throw new Error('Data must be an array');
 *     }
 *     return data.map(item => this.transformItem(item));
 *   }
 * }
 * ```
 *
 * @throws {Error} When the method is not called on a class instance
 * @throws {Error} When errorTransformer is not found on the class
 *
 * @since 1.0.0
 */
function SyncTransform(context) {
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
function AutoTransform(options) {
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