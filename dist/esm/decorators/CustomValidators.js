var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import 'reflect-metadata';
import { registerDecorator, ValidatorConstraint, } from 'class-validator';
/**
 * Custom validation decorator that validates if a date property is after another date property.
 *
 * This decorator compares two date properties in the same object, ensuring that the
 * decorated property's date value is chronologically after the specified reference property.
 * Both properties must contain valid date values for validation to pass.
 *
 * @param property - The name of the property to compare against (reference date)
 * @param validationOptions - Optional validation options from class-validator
 * @returns A property decorator function
 *
 * @example
 * ```typescript
 * class EventDto {
 *   @IsDateString()
 *   startDate: string;
 *
 *   @IsDateString()
 *   @IsAfterDate('startDate', { message: 'End date must be after start date' })
 *   endDate: string;
 * }
 *
 * // Usage
 * const event = new EventDto();
 * event.startDate = '2024-01-01T10:00:00Z';
 * event.endDate = '2024-01-01T12:00:00Z'; // Valid: after startDate
 * ```
 *
 * @example
 * ```typescript
 * class BookingDto {
 *   @IsDateString()
 *   checkIn: string;
 *
 *   @IsDateString()
 *   @IsAfterDate('checkIn', {
 *     message: 'Check-out date must be after check-in date',
 *     each: true
 *   })
 *   checkOut: string;
 * }
 * ```
 *
 * @example
 * ```typescript
 * class ProjectDto {
 *   @IsDate()
 *   startDate: Date;
 *
 *   @IsDate()
 *   @IsAfterDate('startDate', {
 *     message: 'Deadline must be after project start date'
 *   })
 *   deadline: Date;
 * }
 * ```
 *
 * @returns {boolean} true if the decorated property's date is after the reference property's date
 * @returns {boolean} false if either date is null, undefined, or invalid
 *
 * @since 1.0.0
 */
export function IsAfterDate(property, validationOptions) {
    return function (object, propertyName) {
        registerDecorator({
            name: 'isAfter',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value, args) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = args.object[relatedPropertyName];
                    if (!value || !relatedValue) {
                        return false;
                    }
                    return new Date(value) > new Date(relatedValue);
                },
                defaultMessage(args) {
                    const [relatedPropertyName] = args.constraints;
                    return `${args.property} must be after ${relatedPropertyName}`;
                },
            },
        });
    };
}
/**
 * Validator constraint class for conditional enum validation.
 *
 * This constraint validates that a property's value is one of the allowed values
 * based on the value of another property in the same object. It supports both
 * object-based and Map-based enum mappings with custom error messages.
 *
 * @class ConditionalEnumConstraint
 * @implements {ValidatorConstraintInterface}
 *
 * @example
 * ```typescript
 * // Using the constraint directly
 * @Validate(ConditionalEnumConstraint, [{
 *   property: 'type',
 *   enumMap: {
 *     'user': ['admin', 'user', 'guest'],
 *     'system': ['internal', 'external']
 *   },
 *   messageMap: {
 *     'user': 'User role must be admin, user, or guest',
 *     'system': 'System type must be internal or external'
 *   }
 * }])
 * role: string;
 * ```
 *
 * @since 1.0.0
 */
let ConditionalEnumConstraint = class ConditionalEnumConstraint {
    validate(value, args) {
        const [config] = args.constraints;
        const { property, enumMap, allowNull = false, allowUndefined = false } = config;
        const conditionValue = args.object[property];
        // Handle null/undefined cases
        if (value === null && allowNull)
            return true;
        if (value === undefined && allowUndefined)
            return true;
        if (value === null || value === undefined)
            return false;
        // Get the enum/array based on condition property value
        let targetValues;
        if (enumMap instanceof Map) {
            targetValues = enumMap.get(conditionValue);
        }
        else {
            targetValues = enumMap[conditionValue];
        }
        // If no values are defined for this condition, validation passes
        if (!targetValues)
            return true;
        // Handle arrays directly
        if (Array.isArray(targetValues)) {
            return targetValues.includes(value);
        }
        // Handle enum objects
        return Object.values(targetValues).includes(value);
    }
    defaultMessage(args) {
        const [config] = args.constraints;
        const { property, enumMap, messageMap } = config;
        const conditionValue = args.object[property];
        // Check for custom message first
        if (messageMap) {
            let customMessage;
            if (messageMap instanceof Map) {
                customMessage = messageMap.get(conditionValue);
            }
            else {
                customMessage = messageMap[conditionValue];
            }
            if (customMessage) {
                return customMessage;
            }
        }
        // Fallback to default message
        let targetValues;
        if (enumMap instanceof Map) {
            targetValues = enumMap.get(conditionValue);
        }
        else {
            targetValues = enumMap[conditionValue];
        }
        if (!targetValues) {
            return `No valid values defined for ${property} = ${conditionValue}`;
        }
        let validValues;
        if (Array.isArray(targetValues)) {
            validValues = targetValues.join(', ');
        }
        else {
            validValues = Object.values(targetValues).join(', ');
        }
        return `${args.property} must be one of: ${validValues} when ${property} is ${conditionValue}`;
    }
};
ConditionalEnumConstraint = __decorate([
    ValidatorConstraint({ name: 'conditionalEnum', async: false })
], ConditionalEnumConstraint);
export { ConditionalEnumConstraint };
/**
 * Custom validation decorator for conditional enum validation.
 *
 * This decorator validates that a property's value is one of the allowed values
 * based on the value of another property in the same object. It provides a more
 * convenient API compared to using the constraint class directly.
 *
 * @param conditionProperty - The property name that determines which enum values are valid
 * @param enumMap - Mapping of condition values to valid enum values (object or Map)
 * @param validationOptions - Validation options including custom messages and null/undefined handling
 * @param validationOptions.allowNull - Whether null values are allowed (default: false)
 * @param validationOptions.allowUndefined - Whether undefined values are allowed (default: false)
 * @param validationOptions.messageMap - Custom error messages for each condition
 * @returns A property decorator function
 *
 * @example
 * ```typescript
 * enum UserType {
 *   ADMIN = 'admin',
 *   USER = 'user',
 *   GUEST = 'guest'
 * }
 *
 * enum SystemType {
 *   INTERNAL = 'internal',
 *   EXTERNAL = 'external'
 * }
 *
 * class AccessDto {
 *   @IsEnum(['user', 'system'])
 *   type: string;
 *
 *   @IsConditionalEnum('type', {
 *     'user': Object.values(UserType),
 *     'system': Object.values(SystemType)
 *   }, {
 *     messageMap: {
 *       'user': 'User access must be admin, user, or guest',
 *       'system': 'System access must be internal or external'
 *     }
 *   })
 *   accessLevel: string;
 * }
 * ```
 *
 * @example
 * ```typescript
 * class OrderDto {
 *   @IsEnum(['online', 'offline'])
 *   orderType: string;
 *
 *   @IsConditionalEnum('orderType', new Map([
 *     ['online', ['credit_card', 'paypal', 'stripe']],
 *     ['offline', ['cash', 'check', 'bank_transfer']]
 *   ]), {
 *     allowNull: true,
 *     messageMap: new Map([
 *       ['online', 'Online orders must use credit card, PayPal, or Stripe'],
 *       ['offline', 'Offline orders must use cash, check, or bank transfer']
 *     ])
 *   })
 *   paymentMethod: string | null;
 * }
 * ```
 *
 * @example
 * ```typescript
 * class NotificationDto {
 *   @IsEnum(['email', 'sms', 'push'])
 *   channel: string;
 *
 *   @IsConditionalEnum('channel', {
 *     'email': ['immediate', 'daily', 'weekly'],
 *     'sms': ['immediate'],
 *     'push': ['immediate', 'scheduled']
 *   }, {
 *     allowUndefined: true,
 *     message: 'Invalid frequency for the selected channel'
 *   })
 *   frequency?: string;
 * }
 * ```
 *
 * @returns {boolean} true if the value is valid for the given condition
 * @returns {boolean} false if the value is invalid or condition not met
 *
 * @since 1.0.0
 */
export function IsConditionalEnum(conditionProperty, enumMap, validationOptions) {
    return function (object, propertyName) {
        registerDecorator({
            name: 'isConditionalEnum',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [
                {
                    property: conditionProperty,
                    enumMap,
                    messageMap: validationOptions === null || validationOptions === void 0 ? void 0 : validationOptions.messageMap,
                    allowNull: validationOptions === null || validationOptions === void 0 ? void 0 : validationOptions.allowNull,
                    allowUndefined: validationOptions === null || validationOptions === void 0 ? void 0 : validationOptions.allowUndefined,
                },
            ],
            options: validationOptions,
            validator: {
                validate(value, args) {
                    const [config] = args.constraints;
                    const { property, enumMap, allowNull = false, allowUndefined = false } = config;
                    const conditionValue = args.object[property];
                    // Handle null/undefined cases
                    if (value === null && allowNull)
                        return true;
                    if (value === undefined && allowUndefined)
                        return true;
                    if (value === null || value === undefined)
                        return false;
                    // Get the enum/array based on condition property value
                    let targetValues;
                    if (enumMap instanceof Map) {
                        targetValues = enumMap.get(conditionValue);
                    }
                    else {
                        targetValues = enumMap[conditionValue];
                    }
                    // If no values are defined for this condition, validation passes
                    if (!targetValues)
                        return true;
                    // Handle arrays directly
                    if (Array.isArray(targetValues)) {
                        return targetValues.includes(value);
                    }
                    // Handle enum objects
                    return Object.values(targetValues).includes(value);
                },
                defaultMessage(args) {
                    const [config] = args.constraints;
                    const { property, enumMap, messageMap } = config;
                    const conditionValue = args.object[property];
                    // Check for custom message first
                    if (messageMap) {
                        let customMessage;
                        if (messageMap instanceof Map) {
                            customMessage = messageMap.get(conditionValue);
                        }
                        else {
                            customMessage = messageMap[conditionValue];
                        }
                        if (customMessage) {
                            return customMessage;
                        }
                    }
                    // Fallback to default message
                    let targetValues;
                    if (enumMap instanceof Map) {
                        targetValues = enumMap.get(conditionValue);
                    }
                    else {
                        targetValues = enumMap[conditionValue];
                    }
                    if (!targetValues) {
                        return `No valid values defined for ${property} = ${conditionValue}`;
                    }
                    let validValues;
                    if (Array.isArray(targetValues)) {
                        validValues = targetValues.join(', ');
                    }
                    else {
                        validValues = Object.values(targetValues).join(', ');
                    }
                    return `${args.property} must be one of: ${validValues} when ${property} is ${conditionValue}`;
                },
            },
        });
    };
}
//# sourceMappingURL=CustomValidators.js.map