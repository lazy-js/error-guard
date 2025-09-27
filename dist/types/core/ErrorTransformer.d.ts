import { ErrorConstructorEnum, ErrorConstructorType } from '../enums';
import { ErrorInstance } from './Error';
import { ErrorMapBase, ErrorMapOutBase, ErrorMapInputBase } from '../types/transformer';
import { ErrorContextBase } from '../types/errors';
import { ErrorMapBuilder } from './ErrorMapBuilder';
/**
 * Type definition for error mapping configuration.
 * Combines input conditions with output actions for error transformation.
 */
export type ErrorMap = ErrorMapBase<ErrorInstance, ErrorConstructorEnum | ErrorConstructorType>;
/**
 * Type definition for error mapping output actions.
 * Defines what action to take when an input condition matches.
 */
export type ErrorMapOut = ErrorMapOutBase<ErrorInstance, ErrorConstructorEnum | ErrorConstructorType>;
/**
 * Type definition for error mapping input conditions.
 * Defines the conditions that must be met for error transformation.
 */
export type ErrorMapInput = ErrorMapInputBase;
/**
 * Logging levels for error transformer operations.
 * Controls when and what errors are logged during transformation.
 */
export type ErrorTransformerLogLevels = 'unknown' | 'known' | 'all' | 'never';
/**
 * Type for error input that can be transformed.
 * Supports various error formats including Error objects, strings, and plain objects.
 */
export type ErrorInput = Error | string | null | undefined | Record<string, unknown>;
/**
 * Configuration options for ErrorTransformer behavior.
 */
interface ErrorTransformerOptions {
    /** Logging level for error transformation operations */
    log?: ErrorTransformerLogLevels;
}
/**
 * Configuration interface for ErrorTransformer initialization.
 */
interface ErrorTranformerConfig {
    /** ErrorMapBuilder instance containing the error mappings */
    errorMap: ErrorMapBuilder;
    /** Optional module name for context and logging */
    moduleName?: string;
}
/**
 * Error transformation engine that applies configured mappings to transform errors.
 *
 * The ErrorTransformer takes error mappings created with ErrorMapBuilder and applies
 * them to transform various types of errors into standardized formats. It supports
 * both synchronous and asynchronous method wrapping for automatic error transformation.
 *
 * ## Features
 * - **Flexible Input Support**: Handles Error objects, strings, and plain objects
 * - **Multiple Input Conditions**: Supports equals, enum, regex, includes, and instanceof checks
 * - **Diverse Output Actions**: Throw custom errors, strings, or pass through original errors
 * - **Method Wrapping**: Automatic error transformation for sync and async methods
 * - **Configurable Logging**: Multiple logging levels for debugging and monitoring
 * - **Context Preservation**: Maintains error context and adds transformation metadata
 *
 * ## Usage Pattern
 * ```typescript
 * const errorMap = new ErrorMapBuilder({
 *   globalProperty: 'message',
 *   rollbackError: new InternalError({ code: 'UNKNOWN_ERROR' })
 * })
 *   .equals('Database connection failed')
 *   .throwErrorInstance(new DatabaseError({ code: 'CONNECTION_FAILED' }))
 *   .instanceOf(ValidationError)
 *   .throwString('Validation failed');
 *
 * const transformer = new ErrorTransformer({
 *   errorMap,
 *   moduleName: 'DatabaseService'
 * }, { log: 'known' });
 *
 * // Transform errors directly
 * try {
 *   // some operation
 * } catch (err) {
 *   transformer.transform(err, { layer: 'service' });
 * }
 *
 * // Wrap methods for automatic transformation
 * const wrappedMethod = transformer.withAsyncTransform(originalMethod, {
 *   layer: 'service',
 *   className: 'DatabaseService'
 * });
 * ```
 *
 * ## Logging Levels
 * - **'never'**: No logging (default)
 * - **'known'**: Log only successfully transformed errors
 * - **'unknown'**: Log only errors that fall back to default
 * - **'all'**: Log all errors regardless of transformation outcome
 *
 * @class ErrorTransformer
 * @since 1.0.0
 */
export declare class ErrorTransformer {
    options?: ErrorTransformerOptions | undefined;
    /** List of error mappings to apply during transformation */
    private errorMap;
    /** Fallback error to use when no mapping matches */
    private defaultError;
    /** Global property name for error matching */
    private globalProperty;
    /** Current logging level for error transformation */
    private log;
    /** Module name for context and logging */
    private moduleName;
    /**
     * Creates a new ErrorTransformer instance.
     *
     * @param config - Configuration for the error transformer
     * @param config.errorMap - ErrorMapBuilder instance containing error mappings
     * @param config.moduleName - Module name for context and logging (optional)
     * @param options - Additional options for transformer behavior
     * @param options.log - Logging level for error transformation (defaults to 'never')
     *
     * @example
     * ```typescript
     * const errorMap = new ErrorMapBuilder({
     *   globalProperty: 'message',
     *   rollbackError: new InternalError({ code: 'UNKNOWN_ERROR' })
     * });
     *
     * const transformer = new ErrorTransformer({
     *   errorMap,
     *   moduleName: 'UserService'
     * }, { log: 'known' });
     * ```
     *
     * @since 1.0.0
     */
    constructor(config: ErrorTranformerConfig, options?: ErrorTransformerOptions | undefined);
    /**
     * Transforms an error using the configured mappings.
     *
     * Applies all configured error mappings to transform the input error.
     * If no mapping matches, throws the configured default error.
     * The method never returns - it always throws an error.
     *
     * @param err - Error to transform (Error, string, object, null, or undefined)
     * @param patchedContext - Additional context to add to the transformed error
     * @throws {ErrorInstance} The transformed error or default error
     *
     * @example
     * ```typescript
     * try {
     *   // some operation that might fail
     *   await database.query('SELECT * FROM users');
     * } catch (err) {
     *   transformer.transform(err, {
     *     layer: 'service',
     *     className: 'UserService',
     *     methodName: 'getUsers'
     *   });
     * }
     * ```
     *
     * @since 1.0.0
     */
    transform(err: ErrorInput, patchedContext: ErrorContextBase): never;
    /**
     * Wraps an async method with automatic error transformation.
     *
     * Creates a new async function that automatically transforms any errors
     * thrown by the wrapped method using the configured error mappings.
     *
     * @param wrappedMethod - The async method to wrap
     * @param patchedContext - Context to add to any transformed errors
     * @returns {Function} Wrapped async method with error transformation
     *
     * @example
     * ```typescript
     * const originalMethod = async (id: string) => {
     *   // some async operation that might fail
     *   return await database.findById(id);
     * };
     *
     * const wrappedMethod = transformer.withAsyncTransform(originalMethod, {
     *   layer: 'service',
     *   className: 'UserService',
     *   methodName: 'findById'
     * });
     *
     * // Use the wrapped method - errors will be automatically transformed
     * const user = await wrappedMethod('123');
     * ```
     *
     * @since 1.0.0
     */
    withAsyncTransform<TArgs extends readonly unknown[], TReturn>(wrappedMethod: (...args: TArgs) => Promise<TReturn>, patchedContext: ErrorContextBase): (...args: TArgs) => Promise<TReturn>;
    /**
     * Wraps a synchronous method with automatic error transformation.
     *
     * Creates a new synchronous function that automatically transforms any errors
     * thrown by the wrapped method using the configured error mappings.
     *
     * @param wrappedMethod - The synchronous method to wrap
     * @param patchedContext - Context to add to any transformed errors
     * @returns {Function} Wrapped synchronous method with error transformation
     *
     * @example
     * ```typescript
     * const originalMethod = (id: string) => {
     *   // some sync operation that might fail
     *   return database.findByIdSync(id);
     * };
     *
     * const wrappedMethod = transformer.withSyncTransform(originalMethod, {
     *   layer: 'service',
     *   className: 'UserService',
     *   methodName: 'findByIdSync'
     * });
     *
     * // Use the wrapped method - errors will be automatically transformed
     * const user = wrappedMethod('123');
     * ```
     *
     * @since 1.0.0
     */
    withSyncTransform<TArgs extends readonly unknown[], TReturn>(wrappedMethod: (...args: TArgs) => TReturn, patchedContext: ErrorContextBase): (...args: TArgs) => TReturn;
    /**
     * Normalizes various error input types to a standard Error object.
     *
     * Converts strings, objects, and other error formats into Error instances
     * for consistent processing by the transformation engine.
     *
     * @private
     * @param err - Error input to normalize
     * @returns {Error | null} Normalized Error object or null if conversion fails
     *
     * @since 1.0.0
     */
    private normalizeError;
    /**
     * Extracts a property value from an Error object.
     *
     * Safely accesses error properties using dynamic property access,
     * with fallback to the global property if no specific property is provided.
     *
     * @private
     * @param err - Error object to extract property from
     * @param propertyName - Specific property name (optional, uses global property if not provided)
     * @returns {any} Property value or undefined if not found
     *
     * @since 1.0.0
     */
    private getPropertyValue;
    /**
     * Checks if error message includes all specified substrings.
     *
     * Performs case-insensitive substring matching against the error property.
     * All substrings must be present for the match to succeed.
     *
     * @private
     * @param err - Error object to check
     * @param str - Array of substrings to search for
     * @param propertyName - Property to check (optional, uses global property if not provided)
     * @returns {boolean} True if all substrings are found
     *
     * @since 1.0.0
     */
    private msgIncludes;
    /**
     * Checks if error message matches a regular expression.
     *
     * @private
     * @param err - Error object to check
     * @param messageRegex - Regular expression to test against
     * @param propertyName - Property to check (optional, uses global property if not provided)
     * @returns {boolean} True if the regex matches
     *
     * @since 1.0.0
     */
    private msgMatches;
    /**
     * Checks if error message exactly equals a specified string.
     *
     * @private
     * @param err - Error object to check
     * @param message - Exact string to match against
     * @param propertyName - Property to check (optional, uses global property if not provided)
     * @returns {boolean} True if the strings are exactly equal
     *
     * @since 1.0.0
     */
    private msgEquals;
    /**
     * Checks if error is an instance of a specific constructor.
     *
     * @private
     * @param err - Error object to check
     * @param error - Constructor class to check against
     * @returns {boolean} True if error is instance of the constructor
     *
     * @since 1.0.0
     */
    private errorInstanceOf;
    /**
     * Checks if error property value is one of the specified enum values.
     *
     * @private
     * @param err - Error object to check
     * @param enums - Array of enum values to match against
     * @param propertyName - Property to check (optional, uses global property if not provided)
     * @returns {boolean} True if property value is in the enum array
     *
     * @since 1.0.0
     */
    private errorEnum;
    /**
     * Handles input condition checking for error mapping.
     *
     * Routes the input condition to the appropriate checking method
     * based on the condition type.
     *
     * @private
     * @param input - Input condition configuration
     * @param err - Error object to check against
     * @returns {boolean} True if the input condition matches
     *
     * @since 1.0.0
     */
    private handleInput;
    /**
     * Handles the 'pass through' output action by throwing the original error.
     *
     * @private
     * @param originalError - Original error to throw
     * @throws {Error} The original error
     *
     * @since 1.0.0
     */
    private handleThrowOriginalErrorOutput;
    /**
     * Handles the 'throw error instance' output action.
     *
     * Updates the error instance with context and throws it,
     * with optional logging based on the configured log level.
     *
     * @private
     * @param output - Output configuration containing the error instance
     * @param patchedContext - Additional context to add to the error
     * @param originalError - Original error for context
     * @throws {Error} Throws an error if output type is invalid
     * @throws {ErrorInstance} The configured error instance
     *
     * @since 1.0.0
     */
    private handleThrowErrorInstanceOutput;
    /**
     * Handles output actions for error transformation.
     *
     * Routes the output action to the appropriate handler method
     * based on the output type.
     *
     * @private
     * @param output - Output action configuration
     * @param patchedContext - Additional context to add to transformed errors
     * @param originalError - Original error for context
     * @throws {Error} Various error types based on output action
     *
     * @since 1.0.0
     */
    private handleOutput;
}
export {};
//# sourceMappingURL=ErrorTransformer.d.ts.map