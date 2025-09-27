"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadConfigError = exports.NetworkError = exports.InternalError = exports.DatabaseError = exports.ExternalServiceError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.CustomError = void 0;
exports.getErrorConstructor = getErrorConstructor;
const enums_1 = require("../enums");
const StackHelper_1 = require("./StackHelper");
const Separator_1 = require("./Separator");
const Console_1 = require("./Console");
class CustomError extends Error {
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
        return StackHelper_1.StackHelper.createStack(this.name, this.code);
    }
    log({ logContext, filter } = { filter: true, logContext: true }) {
        const keywordsFilter = ['node_modules', 'node:internal'];
        const callStack = filter
            ? StackHelper_1.StackHelper.getAndFilterCallStack(this.stack || '', keywordsFilter)
            : StackHelper_1.StackHelper.getCallStack(this.stack);
        StackHelper_1.StackHelper.logErrorName(this.name, this.code);
        StackHelper_1.StackHelper.logCallStack(callStack);
        if (logContext && this.context) {
            Separator_1.Separator.singleLine('Context');
            Object.keys(this.context).forEach((key) => {
                var _a;
                Console_1.Console.warning(`- ${key}: `);
                console.log((_a = this.context) === null || _a === void 0 ? void 0 : _a[key]);
            });
        }
        else {
            Console_1.Console.warning('No context');
        }
        Separator_1.Separator.doubleLine(' > End of Error < ', { color: 'error' });
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
exports.CustomError = CustomError;
class ValidationError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: enums_1.ErrorCategoryEnum.VALIDATION,
            statusCode: ValidationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, ValidationError._name);
    }
}
exports.ValidationError = ValidationError;
ValidationError._statusCode = 400;
ValidationError._name = enums_1.ErrorConstructorEnum.ValidationError;
// authentication error
class AuthenticationError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: enums_1.ErrorCategoryEnum.AUTHENTICATION,
            statusCode: AuthenticationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, AuthenticationError._name);
    }
}
exports.AuthenticationError = AuthenticationError;
AuthenticationError._statusCode = 401;
AuthenticationError._name = enums_1.ErrorConstructorEnum.AuthenticationError;
class AuthorizationError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: enums_1.ErrorCategoryEnum.AUTHORIZATION,
            statusCode: AuthorizationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, AuthorizationError._name);
    }
}
exports.AuthorizationError = AuthorizationError;
AuthorizationError._statusCode = 403;
AuthorizationError._name = enums_1.ErrorConstructorEnum.AuthorizationError;
class NotFoundError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: enums_1.ErrorCategoryEnum.NOT_FOUND,
            statusCode: NotFoundError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, NotFoundError._name);
    }
}
exports.NotFoundError = NotFoundError;
NotFoundError._statusCode = 404;
NotFoundError._name = enums_1.ErrorConstructorEnum.NotFoundError;
class ConflictError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: enums_1.ErrorCategoryEnum.CONFLICT,
            statusCode: ConflictError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, ConflictError._name);
    }
}
exports.ConflictError = ConflictError;
ConflictError._statusCode = 409;
ConflictError._name = enums_1.ErrorConstructorEnum.ConflictError;
class ExternalServiceError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: enums_1.ErrorCategoryEnum.EXTERNAL_SERVICE,
            statusCode: ExternalServiceError._statusCode,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, ExternalServiceError._name);
        this.externalService = error.externalService;
    }
}
exports.ExternalServiceError = ExternalServiceError;
ExternalServiceError._statusCode = 502;
ExternalServiceError._name = enums_1.ErrorConstructorEnum.ExternalServiceError;
class DatabaseError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: enums_1.ErrorCategoryEnum.DATABASE,
            statusCode: DatabaseError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, DatabaseError._name);
    }
}
exports.DatabaseError = DatabaseError;
DatabaseError._statusCode = 500;
DatabaseError.CODES = enums_1.DatabaseErrorCodesEnum;
DatabaseError._name = enums_1.ErrorConstructorEnum.DatabaseError;
class InternalError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: enums_1.ErrorCategoryEnum.INTERNAL,
            statusCode: InternalError._statusCode,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, InternalError._name);
    }
}
exports.InternalError = InternalError;
InternalError._statusCode = 500;
InternalError._name = enums_1.ErrorConstructorEnum.InternalError;
const axiosErrorMap = new Map([
    ['ECONNABORTED', { code: enums_1.NetworkErrorCodesEnum.SERVER_NOT_REACHABLE, statusCode: 503 }],
    ['ETIMEDOUT', { code: enums_1.NetworkErrorCodesEnum.REQUEST_TIMEOUT, statusCode: 408 }],
    ['ERR_BAD_RESPONSE', { code: enums_1.NetworkErrorCodesEnum.BAD_CONFIGURATION, statusCode: 502 }],
    ['ERR_BAD_REQUEST', { code: enums_1.NetworkErrorCodesEnum.BAD_CONFIGURATION, statusCode: 400 }],
    ['ERR_FR_TOO_MANY_REDIRECTS', { code: enums_1.NetworkErrorCodesEnum.TOO_MANY_REDIRECTS, statusCode: 310 }],
    ['ERR_INVALID_URL', { code: enums_1.NetworkErrorCodesEnum.INVALID_URL, statusCode: 400 }],
    ['ERR_CANCELED', { code: enums_1.NetworkErrorCodesEnum.REQUEST_CANCELED, statusCode: 499 }],
    ['ERR_BAD_OPTION_VALUE', { code: enums_1.NetworkErrorCodesEnum.BAD_CONFIGURATION, statusCode: 500 }],
    ['ERR_BAD_OPTION', { code: enums_1.NetworkErrorCodesEnum.BAD_CONFIGURATION, statusCode: 500 }],
    ['ERR_NETWORK', { code: enums_1.NetworkErrorCodesEnum.SERVER_NOT_REACHABLE, statusCode: 503 }],
    [undefined, { code: enums_1.NetworkErrorCodesEnum.UNKNOWN_ERROR, statusCode: 520 }],
]);
class NetworkError extends CustomError {
    constructor(error) {
        //
        const defaultOptions = {
            category: enums_1.ErrorCategoryEnum.NETWORK,
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
exports.NetworkError = NetworkError;
NetworkError.CODES = enums_1.NetworkErrorCodesEnum;
NetworkError._name = enums_1.ErrorConstructorEnum.NetworkError;
class BadConfigError extends CustomError {
    constructor(error) {
        const defaultOptions = {
            category: enums_1.ErrorCategoryEnum.BAD_CONFIG,
            statusCode: BadConfigError._statusCode,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, BadConfigError._name);
    }
}
exports.BadConfigError = BadConfigError;
BadConfigError._statusCode = 500;
BadConfigError._name = enums_1.ErrorConstructorEnum.BadConfigError;
function getErrorConstructor(constructor) {
    switch (constructor) {
        case enums_1.ErrorConstructorEnum.ValidationError:
            return ValidationError;
        case enums_1.ErrorConstructorEnum.ConflictError:
            return ConflictError;
        case enums_1.ErrorConstructorEnum.ExternalServiceError:
            return ExternalServiceError;
        case enums_1.ErrorConstructorEnum.DatabaseError:
            return DatabaseError;
        case enums_1.ErrorConstructorEnum.InternalError:
            return InternalError;
        case enums_1.ErrorConstructorEnum.NotFoundError:
            return NotFoundError;
        case enums_1.ErrorConstructorEnum.AuthenticationError:
            return AuthenticationError;
        case enums_1.ErrorConstructorEnum.AuthorizationError:
            return AuthorizationError;
        case enums_1.ErrorConstructorEnum.NetworkError:
            return NetworkError;
        case enums_1.ErrorConstructorEnum.BadConfigError:
            return BadConfigError;
    }
}
//# sourceMappingURL=Error.js.map