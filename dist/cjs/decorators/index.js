"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Error transformation decorators
__exportStar(require("./ErrorTransformer"), exports);
// Custom validation decorators
__exportStar(require("./CustomValidators"), exports);
//# sourceMappingURL=index.js.map