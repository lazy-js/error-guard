import { ErrorCategoryEnum, NetworkErrorCodesEnum } from '../enums';
import { CustomError, ValidationError, ConflictError, ExternalServiceError, NotFoundError, InternalError, NetworkError, AuthorizationError, AuthenticationError, BadConfigError } from './Error';
import { ErrorContextBase } from '../types/errors';
export interface ErrorFactoryOptions {
    serviceName?: string;
    defaultTraceId?: string;
}
export declare class ErrorFactory {
    private serviceName;
    private defaultTraceId?;
    constructor(options?: ErrorFactoryOptions);
    createValidationError(code: string, message?: string, context?: Partial<ErrorContextBase>): ValidationError;
    createConflictError(code: string, message?: string, context?: Partial<ErrorContextBase>): ConflictError;
    createNotFoundError(code: string, message?: string, context?: Partial<ErrorContextBase>): NotFoundError;
    createExternalServiceError(code: string, externalService: string, message?: string, context?: Partial<ErrorContextBase>): ExternalServiceError;
    createInternalError(code: string, message?: string, context?: Partial<ErrorContextBase>): InternalError;
    createNetworkError(code: NetworkErrorCodesEnum, message?: string, context?: Partial<ErrorContextBase>): NetworkError;
    createAuthenticationError(code: string, message?: string, context?: Partial<ErrorContextBase>): AuthenticationError;
    createAuthorizationError(code: string, message?: string, context?: Partial<ErrorContextBase>): AuthorizationError;
    createBadConfigError(code: string, message?: string, context?: Partial<ErrorContextBase>): BadConfigError;
    createError(category: ErrorCategoryEnum, code: string, message?: string, context?: Partial<ErrorContextBase>): CustomError;
}
//# sourceMappingURL=ErrorFactory.d.ts.map