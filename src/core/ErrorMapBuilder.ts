import { Constructor, ErrorContextBase } from '../types';
import { ErrorInstance } from './Error';
import { ErrorMap } from './ErrorTransformer';

/**
 * Configuration options for ErrorMapBuilder initialization.
 */
interface ErrorMapBuilderOptions {
    /** Global property name to use for error matching (defaults to 'message') */
    globalProperty: string;
    /** Fallback error to use when no mapping matches */
    rollbackError: ErrorInstance;
}

/**
 * Options for input condition configuration.
 */
interface InputOptions {
    /** Specific property name to match against (overrides global property) */
    propertyName?: string;
}

/**
 * Custom error handler function type for complex error transformations.
 */
type CustomErrorHandler = (err: any, ctx: ErrorContextBase) => Error;

/**
 * Output methods interface for fluent API pattern.
 */
interface OutputMethods {
    /** Throw a specific error instance */
    throwErrorInstance: (errorInstance: ErrorInstance) => ErrorMapBuilder;
    /** Throw a string error */
    throwString: (string: string) => ErrorMapBuilder;
    /** Throw a custom error using a handler function */
    throwCustomError: (handler: CustomErrorHandler) => ErrorMapBuilder;
    /** Pass through the original error unchanged */
    pass: () => ErrorMapBuilder;
}

/**
 * Fluent API builder for creating error mapping configurations.
 *
 * The ErrorMapBuilder provides a chainable interface for defining how different
 * types of errors should be transformed. It supports various input conditions
 * and output actions, enabling flexible error handling strategies.
 *
 * ## Features
 * - **Fluent API**: Chainable methods for intuitive error mapping configuration
 * - **Multiple Input Conditions**: Support for equals, enum, regex, includes, and instanceof checks
 * - **Flexible Outputs**: Throw custom errors, strings, or pass through original errors
 * - **Property Targeting**: Match against specific error properties or use global defaults
 * - **Validation**: Prevents incomplete mappings with built-in validation
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
 *   .throwString('Validation failed')
 *   .build();
 * ```
 *
 * ## Input Conditions
 * - **equals()**: Exact string matching
 * - **oneOf()**: Enum/array value matching
 * - **matches()**: Regular expression matching
 * - **includes()**: Substring array matching
 * - **instanceOf()**: Constructor type checking
 *
 * ## Output Actions
 * - **throwErrorInstance()**: Throw a specific error class instance
 * - **throwString()**: Throw a string error
 * - **throwCustomError()**: Use a custom handler function
 * - **pass()**: Pass through the original error unchanged
 *
 * @class ErrorMapBuilder
 * @since 1.0.0
 */
export class ErrorMapBuilder {
    /** List of completed error mappings */
    public errorMapList: ErrorMap[];

    /** Currently being built error mapping */
    private currentErrorMap: Partial<ErrorMap>;

    /** Global property name for error matching */
    public globalProperty: string;

    /** Fallback error when no mapping matches */
    public rollbackError: ErrorInstance;

    /**
     * Creates a new ErrorMapBuilder instance.
     *
     * @param options - Configuration options for the error map builder
     * @param options.globalProperty - Global property name for error matching (defaults to 'message')
     * @param options.rollbackError - Fallback error to use when no mapping matches
     *
     * @example
     * ```typescript
     * const errorMapBuilder = new ErrorMapBuilder({
     *   globalProperty: 'message',
     *   rollbackError: new InternalError({ code: 'UNKNOWN_ERROR' })
     * });
     * ```
     *
     * @since 1.0.0
     */
    constructor(options: ErrorMapBuilderOptions) {
        this.errorMapList = [];
        this.currentErrorMap = {};
        this.globalProperty = options?.globalProperty || 'message';
        this.rollbackError = options.rollbackError;
    }

    /**
     * Creates a mapping for exact string matching.
     *
     * Matches errors where the specified property exactly equals the given value.
     *
     * @param value - Exact string value to match against
     * @param options - Optional configuration for property targeting
     * @param options.propertyName - Specific property to match (overrides global property)
     * @returns {OutputMethods} Fluent API methods for defining output action
     *
     * @example
     * ```typescript
     * errorMapBuilder
     *   .equals('Database connection failed')
     *   .throwErrorInstance(new DatabaseError({ code: 'CONNECTION_FAILED' }));
     * ```
     *
     * @since 1.0.0
     */
    equals(value: string, options?: InputOptions): OutputMethods {
        this.checkIfInputExists();
        this.currentErrorMap = {
            input: {
                condition: 'equals',
                message: value,
                propertyName: options?.propertyName,
            },
        };
        return this.assignOutputMethods();
    }

    /**
     * Creates a mapping for enum/array value matching.
     *
     * Matches errors where the specified property value is one of the provided enum values.
     *
     * @param enums - Array of string values to match against
     * @param options - Optional configuration for property targeting
     * @param options.propertyName - Specific property to match (overrides global property)
     * @returns {OutputMethods} Fluent API methods for defining output action
     *
     * @example
     * ```typescript
     * errorMapBuilder
     *   .oneOf(['INVALID_EMAIL', 'INVALID_PASSWORD', 'INVALID_USERNAME'])
     *   .throwErrorInstance(new ValidationError({ code: 'INVALID_INPUT' }));
     * ```
     *
     * @since 1.0.0
     */
    oneOf(enums: string[], options?: InputOptions): OutputMethods {
        this.checkIfInputExists();

        this.currentErrorMap = {
            input: {
                condition: 'enum',
                enum: enums,
                propertyName: options?.propertyName,
            },
        };
        return this.assignOutputMethods();
    }

    /**
     * Creates a mapping for regular expression matching.
     *
     * Matches errors where the specified property matches the given regular expression.
     *
     * @param messageRegex - Regular expression to match against
     * @param options - Optional configuration for property targeting
     * @param options.propertyName - Specific property to match (overrides global property)
     * @returns {OutputMethods} Fluent API methods for defining output action
     *
     * @example
     * ```typescript
     * errorMapBuilder
     *   .matches(/^Database.*failed$/i)
     *   .throwErrorInstance(new DatabaseError({ code: 'DB_ERROR' }));
     * ```
     *
     * @since 1.0.0
     */
    matches(messageRegex: RegExp, options?: InputOptions): OutputMethods {
        this.checkIfInputExists();

        this.currentErrorMap = {
            input: {
                condition: 'matches',
                messageRegex,
                propertyName: options?.propertyName,
            },
        };
        return this.assignOutputMethods();
    }

    /**
     * Creates a mapping for substring array matching.
     *
     * Matches errors where the specified property contains any of the provided substrings.
     *
     * @param messageParts - Array of substrings to search for
     * @param options - Optional configuration for property targeting
     * @param options.propertyName - Specific property to match (overrides global property)
     * @returns {OutputMethods} Fluent API methods for defining output action
     *
     * @example
     * ```typescript
     * errorMapBuilder
     *   .includes(['timeout', 'connection', 'network'])
     *   .throwErrorInstance(new NetworkError({ code: 'NETWORK_ERROR' }));
     * ```
     *
     * @since 1.0.0
     */
    includes(messageParts: string[], options?: InputOptions): OutputMethods {
        this.checkIfInputExists();

        this.currentErrorMap = {
            input: {
                condition: 'includes',
                messageParts,
                propertyName: options?.propertyName,
            },
        };
        return this.assignOutputMethods();
    }

    /**
     * Creates a mapping for constructor type checking.
     *
     * Matches errors that are instances of the specified constructor class.
     *
     * @param constructor - Constructor class to check against
     * @returns {OutputMethods} Fluent API methods for defining output action
     *
     * @example
     * ```typescript
     * errorMapBuilder
     *   .instanceOf(ValidationError)
     *   .throwString('Validation failed');
     * ```
     *
     * @since 1.0.0
     */
    instanceOf(constructor: Constructor): OutputMethods {
        this.checkIfInputExists();

        this.currentErrorMap = {
            input: {
                condition: 'instanceOf',
                error: constructor,
            },
        };
        return this.assignOutputMethods();
    }

    /**
     * Assigns output methods to the current error mapping.
     *
     * Creates a bound context for the output methods to maintain proper
     * reference to the current ErrorMapBuilder instance.
     *
     * @private
     * @returns {OutputMethods} Bound output methods for fluent API
     *
     * @since 1.0.0
     */
    private assignOutputMethods(): OutputMethods {
        return {
            throwErrorInstance: this.throwErrorInstance.bind(this),
            throwString: this.throwString.bind(this),
            throwCustomError: this.throwCustomError.bind(this),
            pass: this.pass.bind(this),
        };
    }

    /**
     * Configures the current mapping to throw a specific error instance.
     *
     * @private
     * @param errorInstance - The error instance to throw when this mapping matches
     * @returns {ErrorMapBuilder} This builder instance for method chaining
     *
     * @since 1.0.0
     */
    private throwErrorInstance(errorInstance: ErrorInstance): ErrorMapBuilder {
        this.currentErrorMap = {
            ...this.currentErrorMap,
            output: {
                type: 'ThrowErrorInstance',
                error: errorInstance,
            },
        };
        this.pushCurrentAndClear();
        return this;
    }

    /**
     * Configures the current mapping to throw a string error.
     *
     * @private
     * @param string - The string to throw as an error when this mapping matches
     * @returns {ErrorMapBuilder} This builder instance for method chaining
     *
     * @since 1.0.0
     */
    private throwString(string: string): ErrorMapBuilder {
        this.currentErrorMap = {
            ...this.currentErrorMap,
            output: {
                type: 'ThrowString',
                string,
            },
        };
        this.pushCurrentAndClear();
        return this;
    }

    /**
     * Configures the current mapping to pass through the original error unchanged.
     *
     * @private
     * @returns {ErrorMapBuilder} This builder instance for method chaining
     *
     * @since 1.0.0
     */
    private pass(): ErrorMapBuilder {
        this.currentErrorMap = {
            ...this.currentErrorMap,
            output: {
                type: 'ThrowOriginalError',
            },
        };
        this.pushCurrentAndClear();
        return this;
    }

    /**
     * Configures the current mapping to use a custom error handler.
     *
     * @private
     * @param handler - Custom function to handle error transformation
     * @returns {ErrorMapBuilder} This builder instance for method chaining
     *
     * @since 1.0.0
     */
    private throwCustomError(handler: CustomErrorHandler): ErrorMapBuilder {
        this.currentErrorMap = {
            ...this.currentErrorMap,
            output: {
                type: 'ThrowCustomError',
                handler: (err: any, context: ErrorContextBase) => handler(err, context),
            },
        };
        this.pushCurrentAndClear();
        return this;
    }

    /**
     * Adds the current error mapping to the list and clears it for the next mapping.
     *
     * @private
     *
     * @since 1.0.0
     */
    private pushCurrentAndClear() {
        this.errorMapList.push(this.currentErrorMap as ErrorMap);
        this.currentErrorMap = {};
    }

    /**
     * Validates that no incomplete mapping exists before starting a new one.
     *
     * Throws an error if there's an incomplete mapping (input without output)
     * to prevent configuration errors and ensure all mappings are properly completed.
     *
     * @throws {Error} If there's an incomplete mapping
     *
     * @example
     * ```typescript
     * // This will throw an error:
     * errorMapBuilder
     *   .equals('test')  // Input defined
     *   .equals('test2') // Error: Previous input not completed
     * ```
     *
     * @since 1.0.0
     */
    public checkIfInputExists() {
        if (this.currentErrorMap.input) {
            throw new Error(
                'Incomplete mapping: Previous input was not completed. Call an output method (throwErrorInstance, throwString, etc.) before starting a new mapping.'
            );
        }
    }
}
