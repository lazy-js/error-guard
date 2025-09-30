import { ErrorCategoryEnum, ErrorConstructorEnum, NetworkErrorCodesEnum, DatabaseErrorCodesEnum, } from '../enums';
import { StackHelper } from './StackHelper';
import { Separator } from './Separator';
import { Console } from './Console';
/**
 * Base class for all custom errors in the error handling system.
 *
 * This class provides a standardized error structure that extends the native Error class
 * and implements the IError interface. It includes comprehensive error metadata, logging
 * capabilities, and serialization support for distributed systems.
 *
 * ## Features
 * - **Standardized Structure**: Consistent error properties across all error types
 * - **Operational Classification**: Distinguishes between operational and programming errors
 * - **Rich Context**: Supports detailed error context for debugging
 * - **Trace ID Support**: Built-in distributed tracing support
 * - **Structured Logging**: Advanced logging with stack filtering and context display
 * - **Serialization**: JSON serialization/deserialization for error recovery
 * - **Timestamp Management**: Automatic timestamp handling with update capabilities
 *
 * ## Error Categories
 * - **ValidationError** (400): Input validation failures
 * - **AuthenticationError** (401): Authentication failures
 * - **AuthorizationError** (403): Authorization/permission failures
 * - **NotFoundError** (404): Resource not found
 * - **ConflictError** (409): Resource conflicts
 * - **ExternalServiceError** (502): External service failures
 * - **DatabaseError** (500): Database operation failures
 * - **InternalError** (500): Internal system errors
 * - **NetworkError** (varies): Network-related errors
 * - **BadConfigError** (500): Configuration errors
 * - **TransformationError** (400): Data transformation errors
 *
 * @class CustomError
 * @extends Error
 * @implements IError
 * @since 1.0.0
 */
export class CustomError extends Error {
    /**
     * Creates a new CustomError instance.
     *
     * @param error - Error data implementing the IError interface
     * @param name - Error constructor name for type identification
     *
     * @example
     * ```typescript
     * const error = new CustomError({
     *   code: 'VALIDATION_FAILED',
     *   message: 'Invalid email format',
     *   category: ErrorCategoryEnum.VALIDATION,
     *   isOperational: true,
     *   timestamp: new Date(),
     *   context: { field: 'email', value: 'invalid-email' }
     * }, ErrorConstructorEnum.ValidationError);
     * ```
     *
     * @since 1.0.0
     */
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
        this.stack = error.stack || this.createStack();
    }
    /**
     * Creates a formatted stack trace for the error.
     *
     * Uses the StackHelper utility to generate a clean, formatted stack trace
     * that includes the error name and code for better debugging.
     *
     * @returns {string} Formatted stack trace
     *
     * @since 1.0.0
     */
    createStack() {
        return StackHelper.createStack(this.name, this.code);
    }
    /**
     * Logs the error with structured output and optional filtering.
     *
     * Provides comprehensive error logging with stack trace filtering and context display.
     * Filters out node_modules and internal Node.js stack frames by default for cleaner output.
     *
     * @param options - Logging configuration options
     * @param options.logContext - Whether to log error context (defaults to true)
     * @param options.filter - Whether to filter stack trace (defaults to true)
     *
     * @example
     * ```typescript
     * // Basic logging with defaults
     * error.log();
     *
     * // Log without context
     * error.log({ logContext: false });
     *
     * // Log with full unfiltered stack
     * error.log({ filter: false });
     * ```
     *
     * @since 1.0.0
     */
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
        return this;
    }
    /**
     * Updates the error timestamp to a specific date.
     *
     * @param timestamp - The new timestamp to set
     * @returns this
     * @since 1.0.0
     */
    updateTimestamp(timestamp) {
        this.timestamp = timestamp;
        return this;
    }
    /**
     * Updates the error timestamp to the current date and time.
     * @returns this
     * @since 1.0.0
     */
    updateTimestampToNow() {
        this.timestamp = new Date();
        return this;
    }
    /**
     * Updates the error context with new information.
     *
     * Merges the new context with existing context and updates the timestamp.
     * If the new context contains an originalError with a stack, it will replace
     * the current stack trace.
     *
     * @param context - New context data to merge with existing context
     * @returns this
     * @example
     * ```typescript
     * error.updateContext({
     *   layer: ErrorLayerEnum.SERVICE,
     *   className: 'UserService',
     *   methodName: 'createUser',
     *   originalError: new Error('Database connection failed')
     * });
     * ```
     *
     * @since 1.0.0
     */
    updateContext(context) {
        this.updateTimestampToNow();
        if (context.originalError && context.originalError.stack) {
            this.stack = context.originalError.stack;
        }
        this.context = { ...this.context, ...context };
        return this;
    }
    /**
     * Sets the error layer in the context.
     *
     * @param layer - The layer where the error occurred (service, controller, etc.)
     * @returns this
     * @since 1.0.0
     */
    setLayer(layer) {
        this.context = { ...this.context, layer };
        return this;
    }
    /**
     * Sets the trace ID for distributed tracing.
     *
     * @param traceId - The trace ID to associate with this error
     * @returns this
     * @since 1.0.0
     */
    setTraceId(traceId) {
        this.traceId = traceId;
        return this;
    }
    /**
     * Converts the error to a JSON-serializable object.
     *
     * Useful for logging, API responses, or error recovery scenarios.
     * All properties are included with proper serialization of dates and objects.
     *
     * @returns {object} JSON-serializable error object
     *
     * @example
     * ```typescript
     * const errorJson = error.toJson();
     * console.log(JSON.stringify(errorJson, null, 2));
     * ```
     *
     * @since 1.0.0
     */
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
    /**
     * Creates a CustomError instance from a JSON object.
     *
     * Useful for error recovery, deserialization, or recreating errors from
     * stored error data. This is the inverse operation of toJson().
     *
     * @param json - JSON object containing error data
     * @returns {CustomError} Recreated CustomError instance
     *
     * @example
     * ```typescript
     * const errorData = {
     *   name: 'ValidationError',
     *   code: 'INVALID_EMAIL',
     *   message: 'Invalid email format',
     *   statusCode: 400,
     *   category: 'VALIDATION',
     *   isOperational: true,
     *   timestamp: '2024-01-15T10:30:00.000Z'
     * };
     * const error = CustomError.fromJSON(errorData);
     * ```
     *
     * @since 1.0.0
     */
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
/**
 * Error class for input validation failures.
 *
 * Represents errors that occur when user input fails validation rules.
 * These are typically operational errors caused by invalid user data.
 *
 * @class ValidationError
 * @extends CustomError
 * @implements IError
 * @since 1.0.0
 */
export class ValidationError extends CustomError {
    /**
     * Creates a new ValidationError instance.
     *
     * @param error - Validation error options
     *
     * @example
     * ```typescript
     * const error = new ValidationError({
     *   code: 'INVALID_EMAIL',
     *   message: 'Email format is invalid',
     *   context: {
     *     field: 'email',
     *     providedValue: 'invalid-email',
     *     expectedValueType: 'email'
     *   }
     * });
     * ```
     *
     * @since 1.0.0
     */
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.VALIDATION,
            statusCode: ValidationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        let options = {};
        if (typeof error === 'string') {
            options = { ...options, code: error };
        }
        else {
            options = error;
        }
        super({ ...defaultOptions, ...options }, ValidationError._name);
    }
}
ValidationError._statusCode = 400;
ValidationError._name = ErrorConstructorEnum.ValidationError;
/**
 * Error class for authentication failures.
 *
 * Represents errors that occur when user authentication fails.
 * These are operational errors caused by invalid credentials or authentication issues.
 *
 * @class AuthenticationError
 * @extends CustomError
 * @implements IError
 * @since 1.0.0
 */
export class AuthenticationError extends CustomError {
    /**
     * Creates a new AuthenticationError instance.
     *
     * @param error - Authentication error options
     *
     * @example
     * ```typescript
     * const error = new AuthenticationError({
     *   code: 'INVALID_CREDENTIALS',
     *   message: 'Invalid username or password'
     * });
     * ```
     *
     * @since 1.0.0
     */
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.AUTHENTICATION,
            statusCode: AuthenticationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        let options = {};
        if (typeof error === 'string') {
            options = { ...options, code: error };
        }
        else {
            options = error;
        }
        super({ ...defaultOptions, ...options }, AuthenticationError._name);
    }
}
AuthenticationError._statusCode = 401;
AuthenticationError._name = ErrorConstructorEnum.AuthenticationError;
/**
 * Error class for authorization/permission failures.
 *
 * Represents errors that occur when a user lacks permission to perform an action.
 * These are operational errors caused by insufficient privileges.
 *
 * @class AuthorizationError
 * @extends CustomError
 * @implements IError
 * @since 1.0.0
 */
export class AuthorizationError extends CustomError {
    /**
     * Creates a new AuthorizationError instance.
     *
     * @param error - Authorization error options
     *
     * @example
     * ```typescript
     * const error = new AuthorizationError({
     *   code: 'INSUFFICIENT_PERMISSIONS',
     *   message: 'You do not have permission to access this resource'
     * });
     * ```
     *
     * @since 1.0.0
     */
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.AUTHORIZATION,
            statusCode: AuthorizationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        let options = {};
        if (typeof error === 'string') {
            options = { ...options, code: error };
        }
        else {
            options = error;
        }
        super({ ...defaultOptions, ...options }, AuthorizationError._name);
    }
}
AuthorizationError._statusCode = 403;
AuthorizationError._name = ErrorConstructorEnum.AuthorizationError;
/**
 * Error class for resource not found failures.
 *
 * Represents errors that occur when a requested resource cannot be found.
 * These are operational errors caused by invalid resource identifiers.
 *
 * @class NotFoundError
 * @extends CustomError
 * @implements IError
 * @since 1.0.0
 */
export class NotFoundError extends CustomError {
    /**
     * Creates a new NotFoundError instance.
     *
     * @param error - Not found error options
     *
     * @example
     * ```typescript
     * const error = new NotFoundError({
     *   code: 'USER_NOT_FOUND',
     *   message: 'User with ID 123 does not exist'
     * });
     * ```
     *
     * @since 1.0.0
     */
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.NOT_FOUND,
            statusCode: NotFoundError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        let options = {};
        if (typeof error === 'string') {
            options = { ...options, code: error };
        }
        else {
            options = error;
        }
        super({ ...defaultOptions, ...options }, NotFoundError._name);
    }
}
NotFoundError._statusCode = 404;
NotFoundError._name = ErrorConstructorEnum.NotFoundError;
/**
 * Error class for resource conflict failures.
 *
 * Represents errors that occur when there's a conflict with the current state
 * of a resource (e.g., duplicate creation, version conflicts).
 *
 * @class ConflictError
 * @extends CustomError
 * @implements IError
 * @since 1.0.0
 */
export class ConflictError extends CustomError {
    /**
     * Creates a new ConflictError instance.
     *
     * @param error - Conflict error options
     *
     * @example
     * ```typescript
     * const error = new ConflictError({
     *   code: 'DUPLICATE_EMAIL',
     *   message: 'A user with this email already exists'
     * });
     * ```
     *
     * @since 1.0.0
     */
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.CONFLICT,
            statusCode: ConflictError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        let options = {};
        if (typeof error === 'string') {
            options = { ...options, code: error };
        }
        else {
            options = error;
        }
        super({ ...defaultOptions, ...options }, ConflictError._name);
    }
}
ConflictError._statusCode = 409;
ConflictError._name = ErrorConstructorEnum.ConflictError;
/**
 * Error class for external service failures.
 *
 * Represents errors that occur when external services (APIs, databases, etc.)
 * fail or return unexpected responses. These are typically non-operational errors.
 *
 * @class ExternalServiceError
 * @extends CustomError
 * @implements IError
 * @since 1.0.0
 */
export class ExternalServiceError extends CustomError {
    /**
     * Creates a new ExternalServiceError instance.
     *
     * @param error - External service error options
     *
     * @example
     * ```typescript
     * const error = new ExternalServiceError({
     *   code: 'PAYMENT_SERVICE_UNAVAILABLE',
     *   message: 'Payment service is currently unavailable',
     *   externalService: 'stripe'
     * });
     * ```
     *
     * @since 1.0.0
     */
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
/**
 * Error class for database operation failures.
 *
 * Represents errors that occur during database operations such as
 * connection failures, query errors, or constraint violations.
 *
 * @class DatabaseError
 * @extends CustomError
 * @implements IError
 * @since 1.0.0
 */
export class DatabaseError extends CustomError {
    /**
     * Creates a new DatabaseError instance.
     *
     * @param error - Database error options
     *
     * @example
     * ```typescript
     * const error = new DatabaseError({
     *   code: 'CONNECTION_FAILED',
     *   message: 'Unable to connect to database'
     * });
     * ```
     *
     * @since 1.0.0
     */
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
/**
 * Error class for internal system failures.
 *
 * Represents errors that occur due to internal system issues,
 * programming errors, or unexpected system states.
 *
 * @class InternalError
 * @extends CustomError
 * @implements IError
 * @since 1.0.0
 */
export class InternalError extends CustomError {
    /**
     * Creates a new InternalError instance.
     *
     * @param error - Internal error options
     *
     * @example
     * ```typescript
     * const error = new InternalError({
     *   code: 'UNEXPECTED_ERROR',
     *   message: 'An unexpected error occurred'
     * });
     * ```
     *
     * @since 1.0.0
     */
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.INTERNAL,
            statusCode: InternalError._statusCode,
            isOperational: false,
            timestamp: new Date(),
        };
        let options = {};
        if (typeof error === 'string') {
            options = { ...options, code: error };
        }
        else {
            options = error;
        }
        super({ ...defaultOptions, ...options }, InternalError._name);
    }
}
InternalError._statusCode = 500;
InternalError._name = ErrorConstructorEnum.InternalError;
/**
 * Mapping of Axios error codes to network error codes and status codes.
 * Used for converting Axios request errors to standardized NetworkError instances.
 */
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
/**
 * Error class for network-related failures.
 *
 * Represents errors that occur during network operations such as
 * timeouts, connection failures, or invalid URLs.
 *
 * @class NetworkError
 * @extends CustomError
 * @implements IError
 * @since 1.0.0
 */
export class NetworkError extends CustomError {
    /**
     * Creates a new NetworkError instance.
     *
     * @param error - Network error options
     *
     * @example
     * ```typescript
     * const error = new NetworkError({
     *   code: 'REQUEST_TIMEOUT',
     *   message: 'Request timed out after 30 seconds'
     * });
     * ```
     *
     * @since 1.0.0
     */
    constructor(error) {
        //
        const defaultOptions = {
            category: ErrorCategoryEnum.NETWORK,
            isOperational: false,
            timestamp: new Date(),
        };
        super({ ...defaultOptions, ...error }, NetworkError._name);
    }
    /**
     * Creates a NetworkError from an Axios request error.
     *
     * Converts Axios request errors (network failures, timeouts, etc.) to
     * standardized NetworkError instances with appropriate error codes and status codes.
     *
     * @param err - Axios error object
     * @param context - Error context for debugging
     * @returns {NetworkError} NetworkError instance
     * @throws {InternalError} If the error is not a valid request error
     *
     * @example
     * ```typescript
     * try {
     *   await axios.get('https://api.example.com/data');
     * } catch (err) {
     *   if (err.request && !err.response) {
     *     const networkError = NetworkError.fromAxiosRequestError(err, {
     *       layer: ErrorLayerEnum.SERVICE,
     *       className: 'ApiService'
     *     });
     *   }
     * }
     * ```
     *
     * @since 1.0.0
     */
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
/**
 * Error class for configuration failures.
 *
 * Represents errors that occur due to invalid or missing configuration.
 * These are typically non-operational errors caused by system misconfiguration.
 *
 * @class BadConfigError
 * @extends CustomError
 * @implements IError
 * @since 1.0.0
 */
export class BadConfigError extends CustomError {
    /**
     * Creates a new BadConfigError instance.
     *
     * @param error - Bad config error options
     *
     * @example
     * ```typescript
     * const error = new BadConfigError({
     *   code: 'MISSING_DATABASE_URL',
     *   message: 'Database URL is required but not provided'
     * });
     * ```
     *
     * @since 1.0.0
     */
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.BAD_CONFIG,
            statusCode: BadConfigError._statusCode,
            isOperational: false,
            timestamp: new Date(),
        };
        let options = {};
        if (typeof error === 'string') {
            options = { ...options, code: error };
        }
        else {
            options = error;
        }
        super({ ...defaultOptions, ...options }, BadConfigError._name);
    }
}
BadConfigError._statusCode = 500;
BadConfigError._name = ErrorConstructorEnum.BadConfigError;
/**
 * Error class for data transformation failures.
 *
 * Represents errors that occur during data transformation operations
 * such as serialization, deserialization, or format conversion.
 *
 * @class TransformationError
 * @extends CustomError
 * @implements IError
 * @since 1.0.0
 */
export class TransformationError extends CustomError {
    /**
     * Creates a new TransformationError instance.
     *
     * @param error - Transformation error options
     *
     * @example
     * ```typescript
     * const error = new TransformationError({
     *   code: 'INVALID_JSON_FORMAT',
     *   message: 'Failed to parse JSON data'
     * });
     * ```
     *
     * @since 1.0.0
     */
    constructor(error) {
        const defaultOptions = {
            category: ErrorCategoryEnum.TRANSFORMATION,
            statusCode: TransformationError._statusCode,
            isOperational: true,
            timestamp: new Date(),
        };
        let options = {};
        if (typeof error === 'string') {
            options = { ...options, code: error };
        }
        else {
            options = error;
        }
        super({ ...defaultOptions, ...options }, TransformationError._name);
    }
}
TransformationError._statusCode = 400;
TransformationError._name = ErrorConstructorEnum.BadConfigError;
/**
 * Returns the appropriate error constructor class based on the error constructor enum.
 *
 * This utility function provides a mapping from error constructor enums to their
 * corresponding error classes, enabling dynamic error creation and type resolution.
 *
 * @param constructor - Error constructor enum or type
 * @returns {typeof CustomError} The corresponding error constructor class
 *
 * @example
 * ```typescript
 * const ErrorClass = getErrorConstructor(ErrorConstructorEnum.ValidationError);
 * const error = new ErrorClass({ code: 'INVALID_INPUT', message: 'Invalid input' });
 * ```
 *
 * @since 1.0.0
 */
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
        case ErrorConstructorEnum.TransformationError:
            return TransformationError;
    }
}
//# sourceMappingURL=Error.js.map