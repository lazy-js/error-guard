import { ErrorCategoryEnum, ErrorConstructorEnum, NetworkErrorCodesEnum, DatabaseErrorCodesEnum, } from '../enums';
import { StackHelper } from './StackHelper';
import { Separator } from './Separator';
import { Console } from './Console';
export class CustomError extends Error {
    constructor(error, name) {
        var _a, _b;
        super(error.message || error.code);
        this.code = error.code;
        this.traceId = error.traceId;
        this.serviceName = error.serviceName || process.env.SERVICE_NAME || 'unknown';
        this.context = error.context;
        this.name = name;
        this.message = (_a = error.message) !== null && _a !== void 0 ? _a : '';
        this.category = error.category;
        this.statusCode = (_b = error.statusCode) !== null && _b !== void 0 ? _b : 500;
        this.isOperational = error.isOperational;
        this.timestamp = error.timestamp;
        this.stack = this.createStack();
    }
    createStack() {
        return StackHelper.createStack(this.name, this.code);
    }
    log({ logContext, filter } = { filter: true, logContext: true }) {
        const keywordsFilter = ['node_modules', 'node:internal'];
        const callStack = filter
            ? StackHelper.getAndFilterCallStack(this.stack || '', keywordsFilter)
            : StackHelper.getCallStack(this.stack);
        StackHelper.logErrorName(this.name, this.code);
        StackHelper.logCallStack(callStack);
        if (logContext && this.context) {
            Separator.singleLine('Context');
            Object.keys(this.context).forEach((key) => {
                var _a;
                Console.warning(`- ${key}: `);
                console.log((_a = this.context) === null || _a === void 0 ? void 0 : _a[key]);
            });
        }
        else {
            Console.warning('No context');
        }
        Separator.doubleLine(' > End of Error < ', { color: 'error' });
    }
    updateTimestamp(timestamp) {
        this.timestamp = timestamp;
    }
    updateTimestampToNow() {
        this.timestamp = new Date();
    }
    updateContext(context) {
        this.updateTimestampToNow();
        if (context.originalError && context.originalError.stack) {
            this.stack = context.originalError.stack;
        }
        this.context = { ...this.context, ...context };
    }
    setLayer(layer) {
        this.context = { ...this.context, layer };
    }
    setTraceId(traceId) {
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
    static fromJSON(json) {
        const errorData = {
            code: json.code,
            message: json.message,
            traceId: json.traceId,
            serviceName: json.serviceName,
            category: json.category,
            statusCode: json.statusCode,
            isOperational: json.isOperational,
            timestamp: new Date(json.timestamp),
            context: json.context,
            stack: json.stack,
        };
        return new CustomError(errorData, json.name);
    }
}
export class ValidationError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.VALIDATION,
            statusCode: ValidationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, ValidationError._name);
    }
}
ValidationError._statusCode = 400;
ValidationError._name = ErrorConstructorEnum.ValidationError;
// authentication error
export class AuthenticationError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.AUTHENTICATION,
            statusCode: AuthenticationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, AuthenticationError._name);
    }
}
AuthenticationError._statusCode = 401;
AuthenticationError._name = ErrorConstructorEnum.AuthenticationError;
export class AuthorizationError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.AUTHORIZATION,
            statusCode: AuthorizationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, AuthorizationError._name);
    }
}
AuthorizationError._statusCode = 403;
AuthorizationError._name = ErrorConstructorEnum.AuthorizationError;
export class NotFoundError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.NOT_FOUND,
            statusCode: NotFoundError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, NotFoundError._name);
    }
}
NotFoundError._statusCode = 404;
NotFoundError._name = ErrorConstructorEnum.NotFoundError;
export class ConflictError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.CONFLICT,
            statusCode: ConflictError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, ConflictError._name);
    }
}
ConflictError._statusCode = 409;
ConflictError._name = ErrorConstructorEnum.ConflictError;
export class ExternalServiceError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.EXTERNAL_SERVICE,
            statusCode: ExternalServiceError._statusCode,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, ExternalServiceError._name);
        this.externalService = error.externalService;
    }
}
ExternalServiceError._statusCode = 502;
ExternalServiceError._name = ErrorConstructorEnum.ExternalServiceError;
export class DatabaseError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.DATABASE,
            statusCode: DatabaseError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, DatabaseError._name);
    }
}
DatabaseError._statusCode = 500;
DatabaseError.CODES = DatabaseErrorCodesEnum;
DatabaseError._name = ErrorConstructorEnum.DatabaseError;
export class InternalError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.INTERNAL,
            statusCode: InternalError._statusCode,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, InternalError._name);
    }
}
InternalError._statusCode = 500;
InternalError._name = ErrorConstructorEnum.InternalError;
const axiosErrorMap = new Map([
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
export class NetworkError extends CustomError {
    constructor(error) {
        //
        const defaultOptions = {
            category: ErrorCategoryEnum.NETWORK,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, NetworkError._name);
    }
    static fromAxiosRequestError(err, context) {
        if (!(err === null || err === void 0 ? void 0 : err.request)) {
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
        const mapEntry = axiosErrorMap.get(err === null || err === void 0 ? void 0 : err.code);
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
NetworkError.CODES = NetworkErrorCodesEnum;
NetworkError._name = ErrorConstructorEnum.NetworkError;
export class BadConfigError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.BAD_CONFIG,
            statusCode: BadConfigError._statusCode,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, BadConfigError._name);
    }
}
BadConfigError._statusCode = 500;
BadConfigError._name = ErrorConstructorEnum.BadConfigError;
export function getErrorConstructor(constructor) {
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
    }
}
//# sourceMappingURL=Error.js.map