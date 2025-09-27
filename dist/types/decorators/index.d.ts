/**
 * @fileoverview Decorators module for error handling and validation
 *
 * This module provides decorators for:
 * - Error transformation: Automatic error handling and transformation for methods and classes
 * - Custom validation: Advanced validation decorators for complex business rules
 *
 * @example
 * ```typescript
 * import { AsyncTransform, IsAfterDate, IsConditionalEnum } from './decorators';
 *
 * class UserService {
 *   errorTransformer = new ErrorTransformer();
 *
 *   @AsyncTransform({ layer: 'SERVICE' })
 *   async createUser(userData: CreateUserDto): Promise<User> {
 *     // Automatic error transformation
 *     return await this.userRepository.create(userData);
 *   }
 * }
 *
 * class CreateUserDto {
 *   @IsDateString()
 *   startDate: string;
 *
 *   @IsDateString()
 *   @IsAfterDate('startDate')
 *   endDate: string;
 *
 *   @IsConditionalEnum('type', {
 *     'premium': ['advanced', 'pro'],
 *     'basic': ['standard']
 *   })
 *   plan: string;
 * }
 * ```
 *
 * @since 1.0.0
 */
export * from './ErrorTransformer';
export * from './CustomValidators';
//# sourceMappingURL=index.d.ts.map