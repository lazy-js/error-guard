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
export declare function AsyncTransform(context?: Partial<ErrorContextBase>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
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
export declare function SyncTransform(context?: Partial<ErrorContextBase>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function AutoTransform(options?: {
    exclude?: string[];
    asyncOnly?: boolean;
    defaultContext?: Partial<ErrorContextBase>;
}): <T extends {
    new (...args: any[]): any;
}>(constructor: T) => {
    new (...args: any[]): {
        [x: string]: any;
        applyAutoTransform(opts?: typeof options): void;
    };
} & T;
//# sourceMappingURL=ErrorTransformer.d.ts.map