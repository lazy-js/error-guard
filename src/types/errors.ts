import {
    ErrorCategoryEnum,
    ErrorLayerEnum,
    NetworkErrorCodesEnum,
    DatabaseErrorCodesEnum,
    ErrorLayerType,
} from '../enums';

export type ErrorContextBase = {
    layer?: ErrorLayerEnum | ErrorLayerType;
    className?: string;
    methodName?: string;
    transformerModuleName?: string;
    originalError?: Error;
} & Record<string, any>;

export interface IError {
    code: string;
    traceId?: string;
    statusCode?: number;
    serviceName?: string;
    isOperational: boolean;
    timestamp: Date;
    category: ErrorCategoryEnum;
    message?: string;
    context?: ErrorContextBase;
    stack?: string;
}

export type ErrorOptions = Omit<IError, 'category' | 'isOperational' | 'timestamp'>;

export type ValueType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';
export type ValidationConstraint =
    | 'required'
    | 'min'
    | 'max'
    | 'pattern'
    | 'type'
    | 'enum'
    | 'custom'
    | 'unique'
    | string;

export interface ValidationErrorContext extends ErrorContextBase {
    providedValueType?: ValueType;
    providedValue?: any;
    expectedValueType?: ValueType;
    expectedValueExample?: any;
    path?: string;
    constraint?: ValidationConstraint;
}

export interface ValidationErrorOptions extends ErrorOptions {
    context?: ValidationErrorContext;
}

export type InternalErrorOptions = ErrorOptions;
export type NetworkErrorOptions = ErrorOptions & {
    code: NetworkErrorCodesEnum;
};
export type DatabaseErrorOptions = ErrorOptions & {
    code: DatabaseErrorCodesEnum;
};
export type ExternalServiceErrorOptions = ErrorOptions & {
    externalService: string;
};
export type ConflictErrorOptions = ErrorOptions;
export type NotFoundErrorOptions = ErrorOptions;
export type AuthorizationErrorOptions = ErrorOptions;
export type AuthenticationErrorOptions = ErrorOptions;
export type BadConfigErrorOptions = ErrorOptions;
export type TransformationErrorOptions = ErrorOptions;
