import { ErrorContextBase } from '../types/errors';

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
