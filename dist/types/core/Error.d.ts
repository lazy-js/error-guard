import { IError, ValidationErrorOptions, AuthenticationErrorOptions, AuthorizationErrorOptions, DatabaseErrorOptions, ConflictErrorOptions, NetworkErrorOptions, NotFoundErrorOptions, ExternalServiceErrorOptions, InternalErrorOptions, ErrorContextBase, BadConfigErrorOptions } from '../types/errors';
import { ErrorCategoryEnum, ErrorConstructorEnum, NetworkErrorCodesEnum, DatabaseErrorCodesEnum, ErrorLayerEnum, ErrorConstructorType } from '../enums';
export declare class CustomError extends Error implements IError {
    readonly code: string;
    readonly message: string;
    traceId?: string;
    serviceName: string;
    readonly category: ErrorCategoryEnum;
    statusCode: number;
    readonly isOperational: boolean;
    context?: ErrorContextBase;
    timestamp: Date;
    stack: string;
    readonly name: ErrorConstructorEnum;
    constructor(error: IError, name: ErrorConstructorEnum);
    createStack(): string;
    log({ logContext, filter }?: {
        logContext?: boolean;
        filter?: boolean;
    }): void;
    updateTimestamp(timestamp: Date): void;
    updateTimestampToNow(): void;
    updateContext(context: ErrorContextBase): void;
    setLayer(layer: ErrorLayerEnum): void;
    setTraceId(traceId: string): void;
    toJson(): {
        name: ErrorConstructorEnum;
        code: string;
        message: string;
        statusCode: number;
        traceId: string | undefined;
        serviceName: string;
        category: ErrorCategoryEnum;
        isOperational: boolean;
        timestamp: string;
        context: ErrorContextBase | undefined;
        stack: string;
    };
    static fromJSON(json: Record<string, unknown>): CustomError;
}
export declare class ValidationError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
    constructor(error: ValidationErrorOptions);
}
export declare class AuthenticationError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
    constructor(error: AuthenticationErrorOptions);
}
export declare class AuthorizationError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
    constructor(error: AuthorizationErrorOptions);
}
export declare class NotFoundError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
    constructor(error: NotFoundErrorOptions);
}
export declare class ConflictError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
    constructor(error: ConflictErrorOptions);
}
export declare class ExternalServiceError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
    readonly externalService: string;
    constructor(error: ExternalServiceErrorOptions);
}
export declare class DatabaseError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly CODES: typeof DatabaseErrorCodesEnum;
    static readonly _name: ErrorConstructorEnum;
    constructor(error: DatabaseErrorOptions);
}
export declare class InternalError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
    constructor(error: InternalErrorOptions);
}
export declare class NetworkError extends CustomError implements IError {
    static readonly CODES: typeof NetworkErrorCodesEnum;
    static readonly _name: ErrorConstructorEnum;
    constructor(error: NetworkErrorOptions);
    static fromAxiosRequestError(err: any, context: ErrorContextBase): NetworkError;
}
export declare class BadConfigError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
    constructor(error: BadConfigErrorOptions);
}
export declare function getErrorConstructor(constructor: ErrorConstructorEnum | ErrorConstructorType): typeof ValidationError | typeof NetworkError | undefined;
export type ErrorInstance = ValidationError | ConflictError | ExternalServiceError | DatabaseError | InternalError | NotFoundError | AuthenticationError | AuthorizationError | NetworkError | BadConfigError;
//# sourceMappingURL=Error.d.ts.map