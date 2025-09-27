import 'reflect-metadata';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

export function IsAfterDate(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isAfter',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];

                    if (!value || !relatedValue) {
                        return false;
                    }

                    return new Date(value) > new Date(relatedValue);
                },
                defaultMessage(args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    return `${args.property} must be after ${relatedPropertyName}`;
                },
            },
        });
    };
}

export interface ConditionalEnumConfig {
    property: string;
    enumMap: Record<string | number, any> | Map<any, any>;
    messageMap?: Record<string | number, string> | Map<any, string>;
    allowNull?: boolean;
    allowUndefined?: boolean;
}

// Method 1: Validator Constraint Class - updated with custom messages per key
@ValidatorConstraint({ name: 'conditionalEnum', async: false })
export class ConditionalEnumConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const [config] = args.constraints as [ConditionalEnumConfig];
        const { property, enumMap, allowNull = false, allowUndefined = false } = config;

        const conditionValue = (args.object as any)[property];

        // Handle null/undefined cases
        if (value === null && allowNull) return true;
        if (value === undefined && allowUndefined) return true;
        if (value === null || value === undefined) return false;

        // Get the enum/array based on condition property value
        let targetValues;
        if (enumMap instanceof Map) {
            targetValues = enumMap.get(conditionValue);
        } else {
            targetValues = enumMap[conditionValue];
        }

        // If no values are defined for this condition, validation passes
        if (!targetValues) return true;

        // Handle arrays directly
        if (Array.isArray(targetValues)) {
            return targetValues.includes(value);
        }

        // Handle enum objects
        return Object.values(targetValues).includes(value);
    }

    defaultMessage(args: ValidationArguments) {
        const [config] = args.constraints as [ConditionalEnumConfig];
        const { property, enumMap, messageMap } = config;
        const conditionValue = (args.object as any)[property];

        // Check for custom message first
        if (messageMap) {
            let customMessage;
            if (messageMap instanceof Map) {
                customMessage = messageMap.get(conditionValue);
            } else {
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
        } else {
            targetValues = enumMap[conditionValue];
        }

        if (!targetValues) {
            return `No valid values defined for ${property} = ${conditionValue}`;
        }

        let validValues;
        if (Array.isArray(targetValues)) {
            validValues = targetValues.join(', ');
        } else {
            validValues = Object.values(targetValues).join(', ');
        }

        return `${args.property} must be one of: ${validValues} when ${property} is ${conditionValue}`;
    }
}

// Method 2: Custom Decorator Function - updated with custom messages per key
export function IsConditionalEnum(
    conditionProperty: string,
    enumMap: Record<string | number, any> | Map<any, any>,
    validationOptions?: ValidationOptions & {
        allowNull?: boolean;
        allowUndefined?: boolean;
        messageMap?: Record<string | number, string> | Map<any, string>;
    }
) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isConditionalEnum',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [
                {
                    property: conditionProperty,
                    enumMap,
                    messageMap: validationOptions?.messageMap,
                    allowNull: validationOptions?.allowNull,
                    allowUndefined: validationOptions?.allowUndefined,
                },
            ],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [config] = args.constraints as [ConditionalEnumConfig];
                    const { property, enumMap, allowNull = false, allowUndefined = false } = config;

                    const conditionValue = (args.object as any)[property];

                    // Handle null/undefined cases
                    if (value === null && allowNull) return true;
                    if (value === undefined && allowUndefined) return true;
                    if (value === null || value === undefined) return false;

                    // Get the enum/array based on condition property value
                    let targetValues;
                    if (enumMap instanceof Map) {
                        targetValues = enumMap.get(conditionValue);
                    } else {
                        targetValues = enumMap[conditionValue];
                    }

                    // If no values are defined for this condition, validation passes
                    if (!targetValues) return true;

                    // Handle arrays directly
                    if (Array.isArray(targetValues)) {
                        return targetValues.includes(value);
                    }

                    // Handle enum objects
                    return Object.values(targetValues).includes(value);
                },
                defaultMessage(args: ValidationArguments) {
                    const [config] = args.constraints as [ConditionalEnumConfig];
                    const { property, enumMap, messageMap } = config;
                    const conditionValue = (args.object as any)[property];

                    // Check for custom message first
                    if (messageMap) {
                        let customMessage;
                        if (messageMap instanceof Map) {
                            customMessage = messageMap.get(conditionValue);
                        } else {
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
                    } else {
                        targetValues = enumMap[conditionValue];
                    }

                    if (!targetValues) {
                        return `No valid values defined for ${property} = ${conditionValue}`;
                    }

                    let validValues;
                    if (Array.isArray(targetValues)) {
                        validValues = targetValues.join(', ');
                    } else {
                        validValues = Object.values(targetValues).join(', ');
                    }

                    return `${args.property} must be one of: ${validValues} when ${property} is ${conditionValue}`;
                },
            },
        });
    };
}
