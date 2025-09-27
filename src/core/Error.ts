import {
    IError,
    ValidationErrorOptions,
    AuthenticationErrorOptions,
    AuthorizationErrorOptions,
    DatabaseErrorOptions,
    ConflictErrorOptions,
    NetworkErrorOptions,
    NotFoundErrorOptions,
    ExternalServiceErrorOptions,
    InternalErrorOptions,
    ErrorContextBase,
    BadConfigErrorOptions,
    TransformationErrorOptions,
} from '../types/errors';
import {
    ErrorCategoryEnum,
    ErrorConstructorEnum,
    NetworkErrorCodesEnum,
    DatabaseErrorCodesEnum,
    ErrorLayerEnum,
    ErrorConstructorType,
} from '../enums';
import { StackHelper } from './StackHelper';
import { Separator } from './Separator';
import { Console } from './Console';

export class CustomError extends Error implements IError {
    // error code like message
    public readonly code: string;
    public readonly message: string;
    public traceId?: string;

    public serviceName: string;
    // error category like validation, authentication, authorization, etc.
    public readonly category: ErrorCategoryEnum;

    // http status code
    public statusCode: number;

    // is operational cuased by the user or not
    public readonly isOperational: boolean;

    // error context like request, response, etc.
    public context?: ErrorContextBase;

    // error timestamp
    public timestamp: Date;

    // error stack
    public stack: string;

    // error constructor name
    public readonly name: ErrorConstructorEnum;

    constructor(error: IError, name: ErrorConstructorEnum) {
        super(error.message || error.code);
        this.code = error.code;
        this.traceId = error.traceId;
        this.serviceName = error.serviceName || process.env.SERVICE_NAME || 'unknown';
        this.context = error.context;
        this.name = name;
        this.message = error.message ?? '';
        this.category = error.category;
        this.statusCode = error.statusCode ?? 500;
        this.isOperational = error.isOperational;
        this.timestamp = error.timestamp;
        this.stack = error.stack || this.createStack();
    }

    createStack(): string {
        return StackHelper.createStack(this.name, this.code);
    }

    log({ logContext, filter }: { logContext?: boolean; filter?: boolean } = { filter: true, logContext: true }): void {
        const keywordsFilter = ['node_modules', 'node:internal'];
        const callStack = filter
            ? StackHelper.getAndFilterCallStack(this.stack || '', keywordsFilter)
            : StackHelper.getCallStack(this.stack);
        StackHelper.logErrorName(this.name, this.code);
        StackHelper.logCallStack(callStack);
        if (logContext && this.context) {
            Separator.singleLine('Context');

            Object.keys(this.context).forEach((key: string) => {
                Console.warning(`- ${key}: `);
                console.log(this.context?.[key] as string);
            });
        } else {
            Console.warning('No context');
        }
        Separator.doubleLine(' > End of Error < ', { color: 'error' });
    }

    updateTimestamp(timestamp: Date): void {
        this.timestamp = timestamp;
    }

    updateTimestampToNow(): void {
        this.timestamp = new Date();
    }

    updateContext(context: ErrorContextBase): void {
        this.updateTimestampToNow();
        if (context.originalError && context.originalError.stack) {
            this.stack = context.originalError.stack;
        }
        this.context = { ...this.context, ...context };
    }

    setLayer(layer: ErrorLayerEnum): void {
        this.context = { ...this.context, layer };
    }

    setTraceId(traceId: string) {
        this.traceId = traceId;
    }

    toJson() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            traceId: this.traceId,
            serviceName: this.serviceName,
            category: this.category,
            isOperational: this.isOperational,
            timestamp: this.timestamp.toISOString(),
            context: this.context,
            stack: this.stack,
        };
    }

    // Create error from JSON (useful for error recovery)
    static fromJSON(json: Record<string, unknown>): CustomError {
        const errorData: IError = {
            code: json.code as string,
            message: json.message as string,
            traceId: json.traceId as string,
            serviceName: json.serviceName as string,
            category: json.category as ErrorCategoryEnum,
            statusCode: json.statusCode as number,
            isOperational: json.isOperational as boolean,
            timestamp: new Date(json.timestamp as string),
            context: json.context as ErrorContextBase,
            stack: json.stack as string,
        };

        return new CustomError(errorData, json.name as ErrorConstructorEnum);
    }
}

export class ValidationError extends CustomError implements IError {
    static readonly _statusCode: number = 400;
    static readonly _name: ErrorConstructorEnum = ErrorConstructorEnum.ValidationError;

    constructor(error: ValidationErrorOptions) {
        const defaultOptions: Partial<IError> = {
            category: ErrorCategoryEnum.VALIDATION,
            statusCode: ValidationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error } as IError, ValidationError._name);
    }
}

// authentication error
export class AuthenticationError extends CustomError implements IError {
    static readonly _statusCode: number = 401;
    static readonly _name: ErrorConstructorEnum = ErrorConstructorEnum.AuthenticationError;
    constructor(error: AuthenticationErrorOptions) {
        const defaultOptions: Partial<IError> = {
            category: ErrorCategoryEnum.AUTHENTICATION,
            statusCode: AuthenticationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error } as IError, AuthenticationError._name);
    }
}

export class AuthorizationError extends CustomError implements IError {
    static readonly _statusCode: number = 403;
    static readonly _name: ErrorConstructorEnum = ErrorConstructorEnum.AuthorizationError;
    constructor(error: AuthorizationErrorOptions) {
        const defaultOptions: Partial<IError> = {
            category: ErrorCategoryEnum.AUTHORIZATION,
            statusCode: AuthorizationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error } as IError, AuthorizationError._name);
    }
}

export class NotFoundError extends CustomError implements IError {
    static readonly _statusCode: number = 404;
    static readonly _name: ErrorConstructorEnum = ErrorConstructorEnum.NotFoundError;
    constructor(error: NotFoundErrorOptions) {
        const defaultOptions: Partial<IError> = {
            category: ErrorCategoryEnum.NOT_FOUND,
            statusCode: NotFoundError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error } as IError, NotFoundError._name);
    }
}

export class ConflictError extends CustomError implements IError {
    static readonly _statusCode: number = 409;
    static readonly _name: ErrorConstructorEnum = ErrorConstructorEnum.ConflictError;
    constructor(error: ConflictErrorOptions) {
        const defaultOptions: Partial<IError> = {
            category: ErrorCategoryEnum.CONFLICT,
            statusCode: ConflictError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error } as IError, ConflictError._name);
    }
}

export class ExternalServiceError extends CustomError implements IError {
    static readonly _statusCode: number = 502;
    static readonly _name: ErrorConstructorEnum = ErrorConstructorEnum.ExternalServiceError;
    public readonly externalService: string;
    constructor(error: ExternalServiceErrorOptions) {
        const defaultOptions: Partial<IError> = {
            category: ErrorCategoryEnum.EXTERNAL_SERVICE,
            statusCode: ExternalServiceError._statusCode,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error } as IError, ExternalServiceError._name);
        this.externalService = error.externalService;
    }
}

export class DatabaseError extends CustomError implements IError {
    static readonly _statusCode: number = 500;
    static readonly CODES = DatabaseErrorCodesEnum;
    static readonly _name: ErrorConstructorEnum = ErrorConstructorEnum.DatabaseError;
    constructor(error: DatabaseErrorOptions) {
        const defaultOptions: Partial<IError> = {
            category: ErrorCategoryEnum.DATABASE,
            statusCode: DatabaseError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error } as IError, DatabaseError._name);
    }
}

export class InternalError extends CustomError implements IError {
    static readonly _statusCode: number = 500;
    static readonly _name: ErrorConstructorEnum = ErrorConstructorEnum.InternalError;
    constructor(error: InternalErrorOptions) {
        const defaultOptions: Partial<IError> = {
            category: ErrorCategoryEnum.INTERNAL,
            statusCode: InternalError._statusCode,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error } as IError, InternalError._name);
    }
}

const axiosErrorMap = new Map<string | undefined, { code: NetworkErrorCodesEnum; statusCode: number }>([
    ['ECONNABORTED', { code: NetworkErrorCodesEnum.SERVER_NOT_REACHABLE, statusCode: 503 }],
    ['ETIMEDOUT', { code: NetworkErrorCodesEnum.REQUEST_TIMEOUT, statusCode: 408 }],
    ['ERR_BAD_RESPONSE', { code: NetworkErrorCodesEnum.BAD_CONFIGURATION, statusCode: 502 }],
    ['ERR_BAD_REQUEST', { code: NetworkErrorCodesEnum.BAD_CONFIGURATION, statusCode: 400 }],
    ['ERR_FR_TOO_MANY_REDIRECTS', { code: NetworkErrorCodesEnum.TOO_MANY_REDIRECTS, statusCode: 310 }],
    ['ERR_INVALID_URL', { code: NetworkErrorCodesEnum.INVALID_URL, statusCode: 400 }],
    ['ERR_CANCELED', { code: NetworkErrorCodesEnum.REQUEST_CANCELED, statusCode: 499 }],
    ['ERR_BAD_OPTION_VALUE', { code: NetworkErrorCodesEnum.BAD_CONFIGURATION, statusCode: 500 }],
    ['ERR_BAD_OPTION', { code: NetworkErrorCodesEnum.BAD_CONFIGURATION, statusCode: 500 }],
    ['ERR_NETWORK', { code: NetworkErrorCodesEnum.SERVER_NOT_REACHABLE, statusCode: 503 }],
    [undefined, { code: NetworkErrorCodesEnum.UNKNOWN_ERROR, statusCode: 520 }],
]);

export class NetworkError extends CustomError implements IError {
    static readonly CODES = NetworkErrorCodesEnum;
    static readonly _name: ErrorConstructorEnum = ErrorConstructorEnum.NetworkError;
    constructor(error: NetworkErrorOptions) {
        //
        const defaultOptions: Partial<IError> = {
            category: ErrorCategoryEnum.NETWORK,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error } as IError, NetworkError._name);
    }
    static fromAxiosRequestError(err: any, context: ErrorContextBase): NetworkError {
        if (!err?.request) {
            throw new InternalError({
                code: 'INVALID_CALL',
                message: 'calling fromAxiosRequestError without request, this is not a request error',
            });
        }

        if (err.response) {
            throw new InternalError({
                code: 'INVALID_CALL',
                message: 'calling fromAxiosRequestError with response, this is not a request error',
            });
        }

        const mapEntry = axiosErrorMap.get(err?.code) as {
            code: NetworkErrorCodesEnum;
            statusCode: number;
        };

        const contextWithOriginalError = {
            ...context,
            originalError: err,
        };

        const networkError = new NetworkError({
            code: mapEntry.code,
            statusCode: mapEntry.statusCode,
            context: contextWithOriginalError,
        });

        networkError.statusCode = mapEntry.statusCode;
        return networkError;
    }
}

export class BadConfigError extends CustomError implements IError {
    static readonly _statusCode: number = 500;
    static readonly _name: ErrorConstructorEnum = ErrorConstructorEnum.BadConfigError;
    constructor(error: BadConfigErrorOptions) {
        const defaultOptions: Partial<IError> = {
            category: ErrorCategoryEnum.BAD_CONFIG,
            statusCode: BadConfigError._statusCode,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error } as IError, BadConfigError._name);
    }
}

export class TransformationError extends CustomError implements IError {
    static readonly _statusCode: number = 400;
    static readonly _name: ErrorConstructorEnum = ErrorConstructorEnum.BadConfigError;
    constructor(error: TransformationErrorOptions) {
        const defaultOptions: Partial<IError> = {
            category: ErrorCategoryEnum.TRANSFORMATION,
            statusCode: TransformationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error } as IError, TransformationError._name);
    }
}

export function getErrorConstructor(constructor: ErrorConstructorEnum | ErrorConstructorType) {
    switch (constructor) {
        case ErrorConstructorEnum.ValidationError:
            return ValidationError;
        case ErrorConstructorEnum.ConflictError:
            return ConflictError;
        case ErrorConstructorEnum.ExternalServiceError:
            return ExternalServiceError;
        case ErrorConstructorEnum.DatabaseError:
            return DatabaseError;
        case ErrorConstructorEnum.InternalError:
            return InternalError;
        case ErrorConstructorEnum.NotFoundError:
            return NotFoundError;
        case ErrorConstructorEnum.AuthenticationError:
            return AuthenticationError;
        case ErrorConstructorEnum.AuthorizationError:
            return AuthorizationError;
        case ErrorConstructorEnum.NetworkError:
            return NetworkError;
        case ErrorConstructorEnum.BadConfigError:
            return BadConfigError;
        case ErrorConstructorEnum.TransformationError:
            return TransformationError;
    }
}

export type ErrorInstance =
    | ValidationError
    | ConflictError
    | ExternalServiceError
    | DatabaseError
    | InternalError
    | NotFoundError
    | AuthenticationError
    | AuthorizationError
    | NetworkError
    | BadConfigError
    | TransformationError;
