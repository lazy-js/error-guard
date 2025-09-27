import { ErrorCategoryEnum, ErrorLayerEnum, NetworkErrorCodesEnum, DatabaseErrorCodesEnum, ErrorLayerType } from '../enums';
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
export type ValidationConstraint = 'required' | 'min' | 'max' | 'pattern' | 'type' | 'enum' | 'custom' | 'unique' | string;
export interface ValidationErrorContext extends ErrorContextBase {
    providedValueType?: ValueType;
    providedValue?: any;
    expectedValueType?: ValueType;
    expectedValueExample?: any;
    path?: string;
    constraint?: ValidationConstraint;
}
export type NetworkErrorOptions = ErrorOptions & {
    code: NetworkErrorCodesEnum;
};
export type DatabaseErrorOptions = ErrorOptions & {
    code: DatabaseErrorCodesEnum;
};
export type ExternalServiceErrorOptions = ErrorOptions & {
    externalService: string;
};
export type ValidationErrorOptions<T extends string = string> = (ErrorOptions & {
    context?: ValidationErrorContext;
}) | T;
export type InternalErrorOptions<T extends string = string> = ErrorOptions | T;
export type ConflictErrorOptions<T extends string = string> = ErrorOptions | T;
export type NotFoundErrorOptions<T extends string = string> = ErrorOptions | T;
export type AuthorizationErrorOptions<T extends string = string> = ErrorOptions | T;
export type AuthenticationErrorOptions<T extends string = string> = ErrorOptions | T;
export type BadConfigErrorOptions<T extends string = string> = ErrorOptions | T;
export type TransformationErrorOptions<T extends string = string> = ErrorOptions | T;
//# sourceMappingURL=errors.d.ts.map