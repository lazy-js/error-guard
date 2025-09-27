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
export class ErrorTransformer {
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
    constructor(config, options) {
        this.options = options;
        if (!config || !config.moduleName) {
            console.warn('moduleName is not provided, using unknown_module');
        }
        this.errorMap = config.errorMap.errorMapList;
        this.defaultError = config.errorMap.rollbackError;
        this.globalProperty = config.errorMap.globalProperty;
        this.log = (options === null || options === void 0 ? void 0 : options.log) || 'never';
        this.moduleName = (config === null || config === void 0 ? void 0 : config.moduleName) || 'unknown_module';
    }
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
    transform(err, patchedContext) {
        if (typeof this.defaultError !== 'string') {
            this.defaultError.updateContext({
                ...patchedContext,
                originalError: this.normalizeError(err) || new Error('Unknown error'),
            });
            this.defaultError.updateTimestampToNow();
        }
        const normalizedError = this.normalizeError(err);
        if (!normalizedError || !this.getPropertyValue(normalizedError, this.globalProperty)) {
            throw this.defaultError;
        }
        for (const error of this.errorMap) {
            if (this.handleInput(error.input, normalizedError)) {
                this.handleOutput(error.output, patchedContext, normalizedError);
            }
        }
        if (this.log === 'all' || this.log === 'unknown') {
            if (typeof this.defaultError !== 'string') {
                this.defaultError.log();
            }
        }
        throw this.defaultError;
    }
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
    withAsyncTransform(wrappedMethod, patchedContext) {
        if (!wrappedMethod) {
            throw new Error('Wrapped method is required');
        }
        return async (...args) => {
            try {
                const result = await wrappedMethod.apply(this, args);
                return result;
            }
            catch (err) {
                throw this.transform(err, patchedContext);
            }
        };
    }
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
    withSyncTransform(wrappedMethod, patchedContext) {
        if (!wrappedMethod) {
            throw new Error('Wrapped method is required');
        }
        return (...args) => {
            try {
                const fn = wrappedMethod.apply(this, args);
                return fn;
            }
            catch (err) {
                throw this.transform(err, patchedContext);
            }
        };
    }
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
    normalizeError(err) {
        if (err instanceof Error) {
            return err;
        }
        if (typeof err === 'string') {
            return new Error(err);
        }
        if (err && typeof err === 'object') {
            // Try to create an error from object properties
            const message = err.message || err.code || String(err);
            return new Error(message);
        }
        return null;
    }
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
    getPropertyValue(err, propertyName) {
        if (!err)
            return undefined;
        const _property = propertyName || this.globalProperty;
        try {
            // Use type assertion for dynamic property access
            const errorObj = err;
            if (!errorObj[_property]) {
                return undefined;
            }
            return errorObj[_property];
        }
        catch (error) {
            return undefined;
        }
    }
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
    msgIncludes(err, str, propertyName) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        const message = _value === null || _value === void 0 ? void 0 : _value.toLowerCase();
        return str.every((s) => message.includes(s.toLowerCase()));
    }
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
    msgMatches(err, messageRegex, propertyName) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        return messageRegex.test(_value);
    }
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
    msgEquals(err, message, propertyName) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        return _value === message;
    }
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
    errorInstanceOf(err, error) {
        return err instanceof error;
    }
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
    errorEnum(err, enums, propertyName) {
        const _value = this.getPropertyValue(err, propertyName);
        if (!_value) {
            return false;
        }
        return enums.includes(_value);
    }
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
    handleInput(input, err) {
        switch (input.condition) {
            case 'includes':
                return this.msgIncludes(err, input.messageParts, input.propertyName);
            case 'matches':
                return this.msgMatches(err, input.messageRegex, input.propertyName);
            case 'equals':
                return this.msgEquals(err, input.message, input.propertyName);
            case 'instanceOf':
                return this.errorInstanceOf(err, input.error);
            case 'enum':
                return this.errorEnum(err, input.enum, input.propertyName);
            default:
                return false;
        }
    }
    /**
     * Handles the 'pass through' output action by throwing the original error.
     *
     * @private
     * @param originalError - Original error to throw
     * @throws {Error} The original error
     *
     * @since 1.0.0
     */
    handleThrowOriginalErrorOutput(originalError) {
        throw originalError;
    }
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
    handleThrowErrorInstanceOutput(output, patchedContext, originalError) {
        if (output === 'ThrowOriginalError' || (output === null || output === void 0 ? void 0 : output.type) !== 'ThrowErrorInstance') {
            throw new Error('Output type is not ThrowErrorInstance');
        }
        let error = output.error;
        const newContext = {
            ...error.context,
            ...patchedContext,
            transformerModuleName: this.moduleName,
            originalError: originalError || new Error('Unknown error'),
        };
        error.updateContext(newContext);
        // handle log
        if (this.log === 'all' || this.log === 'known') {
            error.log();
        }
        throw error;
    }
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
    handleOutput(output, patchedContext, originalError) {
        // handle pass action
        if (output === 'ThrowOriginalError' || output.type === 'ThrowOriginalError') {
            this.handleThrowOriginalErrorOutput(originalError);
        }
        // handle error instance action
        if (output.type === 'ThrowErrorInstance') {
            this.handleThrowErrorInstanceOutput(output, patchedContext, originalError);
        }
        // handle custom error action
        if (output.type === 'ThrowCustomError') {
            throw output.handler(originalError, {
                ...patchedContext,
                transformerModuleName: this.moduleName,
            });
        }
        // handle string action
        if (this.log === 'all' || this.log === 'known') {
            console.log(output.string);
        }
        throw output.string;
    }
}
//# sourceMappingURL=ErrorTransformer.js.map