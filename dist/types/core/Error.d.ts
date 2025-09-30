import { IError, ValidationErrorOptions, AuthenticationErrorOptions, AuthorizationErrorOptions, DatabaseErrorOptions, ConflictErrorOptions, NetworkErrorOptions, NotFoundErrorOptions, ExternalServiceErrorOptions, InternalErrorOptions, ErrorContextBase, BadConfigErrorOptions, TransformationErrorOptions } from '../types/errors';
import { ErrorCategoryEnum, ErrorConstructorEnum, NetworkErrorCodesEnum, DatabaseErrorCodesEnum, ErrorLayerEnum, ErrorConstructorType } from '../enums';
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
export declare class CustomError extends Error implements IError {
    /** Error code identifier (e.g., 'VALIDATION_FAILED', 'USER_NOT_FOUND') */
    readonly code: string;
    /** Human-readable error message */
    readonly message: string;
    /** Distributed tracing identifier for request correlation */
    traceId?: string;
    /** Service name where the error originated */
    serviceName: string;
    /** Error category classification (validation, authentication, etc.) */
    readonly category: ErrorCategoryEnum;
    /** HTTP status code for API responses */
    statusCode: number;
    /** Whether this is an operational error (user-caused) or programming error */
    readonly isOperational: boolean;
    /** Additional error context for debugging (request data, stack info, etc.) */
    context?: ErrorContextBase;
    /** Timestamp when the error occurred */
    timestamp: Date;
    /** Error stack trace */
    stack: string;
    /** Error constructor name for type identification */
    readonly name: ErrorConstructorEnum;
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
    constructor(error: IError, name: ErrorConstructorEnum);
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
    createStack(): string;
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
    log({ logContext, filter }?: {
        logContext?: boolean;
        filter?: boolean;
    }): this;
    /**
     * Updates the error timestamp to a specific date.
     *
     * @param timestamp - The new timestamp to set
     * @returns this
     * @since 1.0.0
     */
    updateTimestamp(timestamp: Date): this;
    /**
     * Updates the error timestamp to the current date and time.
     * @returns this
     * @since 1.0.0
     */
    updateTimestampToNow(): this;
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
    updateContext(context: ErrorContextBase): this;
    /**
     * Sets the error layer in the context.
     *
     * @param layer - The layer where the error occurred (service, controller, etc.)
     * @returns this
     * @since 1.0.0
     */
    setLayer(layer: ErrorLayerEnum): this;
    /**
     * Sets the trace ID for distributed tracing.
     *
     * @param traceId - The trace ID to associate with this error
     * @returns this
     * @since 1.0.0
     */
    setTraceId(traceId: string): this;
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
    static fromJSON(json: Record<string, unknown>): CustomError;
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
export declare class ValidationError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
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
    constructor(error: ValidationErrorOptions);
}
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
export declare class AuthenticationError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
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
    constructor(error: AuthenticationErrorOptions);
}
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
export declare class AuthorizationError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
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
    constructor(error: AuthorizationErrorOptions);
}
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
export declare class NotFoundError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
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
    constructor(error: NotFoundErrorOptions);
}
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
export declare class ConflictError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
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
    constructor(error: ConflictErrorOptions);
}
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
export declare class ExternalServiceError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
    /** Name of the external service that failed */
    readonly externalService: string;
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
    constructor(error: ExternalServiceErrorOptions);
}
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
export declare class DatabaseError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly CODES: typeof DatabaseErrorCodesEnum;
    static readonly _name: ErrorConstructorEnum;
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
    constructor(error: DatabaseErrorOptions);
}
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
export declare class InternalError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
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
    constructor(error: InternalErrorOptions);
}
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
export declare class NetworkError extends CustomError implements IError {
    static readonly CODES: typeof NetworkErrorCodesEnum;
    static readonly _name: ErrorConstructorEnum;
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
    constructor(error: NetworkErrorOptions);
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
    static fromAxiosRequestError(err: any, context: ErrorContextBase): NetworkError;
}
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
export declare class BadConfigError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
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
    constructor(error: BadConfigErrorOptions);
}
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
export declare class TransformationError extends CustomError implements IError {
    static readonly _statusCode: number;
    static readonly _name: ErrorConstructorEnum;
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
    constructor(error: TransformationErrorOptions);
}
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
export declare function getErrorConstructor(constructor: ErrorConstructorEnum | ErrorConstructorType): typeof ValidationError | typeof NetworkError | undefined;
/**
 * Union type of all possible error instances.
 *
 * This type represents any error class that extends CustomError,
 * providing type safety for error handling and type checking.
 *
 * @since 1.0.0
 */
export type ErrorInstance = ValidationError | ConflictError | ExternalServiceError | DatabaseError | InternalError | NotFoundError | AuthenticationError | AuthorizationError | NetworkError | BadConfigError | TransformationError;
//# sourceMappingURL=Error.d.ts.map