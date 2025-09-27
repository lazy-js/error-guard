# API Documentation

## Table of Contents

-   [Core Classes](#core-classes)
-   [Error Types](#error-types)
-   [Middleware](#middleware)
-   [Decorators](#decorators)
-   [Types & Interfaces](#types--interfaces)
-   [Enums](#enums)
-   [Utilities](#utilities)

## Core Classes

### CustomError

Base abstract class for all custom errors in the error handling system.

```typescript
abstract class CustomError extends Error implements IError
```

#### Properties

| Property        | Type                | Description                              |
| --------------- | ------------------- | ---------------------------------------- |
| `code`          | `string`            | Unique error code identifier             |
| `traceId`       | `string?`           | Distributed tracing identifier           |
| `statusCode`    | `number`            | HTTP status code                         |
| `serviceName`   | `string?`           | Name of the service where error occurred |
| `isOperational` | `boolean`           | Whether this is an operational error     |
| `timestamp`     | `Date`              | When the error occurred                  |
| `category`      | `ErrorCategoryEnum` | Error category classification            |
| `message`       | `string?`           | Human-readable error message             |
| `context`       | `ErrorContextBase?` | Additional error context                 |
| `stack`         | `string?`           | Error stack trace                        |

#### Methods

##### `toJSON(): object`

Serializes the error to a JSON object.

**Returns:** `object` - JSON representation of the error

**Example:**

```typescript
const error = new ValidationError({
    code: 'INVALID_EMAIL',
    message: 'Email format is invalid',
});

console.log(error.toJSON());
// {
//   code: 'INVALID_EMAIL',
//   message: 'Email format is invalid',
//   statusCode: 400,
//   category: 'VALIDATION',
//   isOperational: true,
//   timestamp: '2024-01-01T00:00:00.000Z'
// }
```

##### `toString(): string`

Returns a string representation of the error.

**Returns:** `string` - String representation

##### `updateTimestamp(): void`

Updates the error timestamp to the current time.

### ErrorTransformer

Transforms errors based on configured mappings and context.

```typescript
class ErrorTransformer
```

#### Constructor

```typescript
constructor(config: ErrorTransformerConfig)
```

**Parameters:**

-   `config.errorMap` - ErrorMapBuilder instance containing error mappings
-   `config.moduleName` - Name of the module using this transformer
-   `config.options?` - Optional configuration options

#### Methods

##### `transform(error: ErrorInput, context?: ErrorContextBase): never`

Transforms an error based on configured mappings.

**Parameters:**

-   `error` - The error to transform (Error, string, null, undefined, or object)
-   `context` - Optional context to include in the transformed error

**Throws:** Transformed error based on mappings or rollback error

**Example:**

```typescript
const transformer = new ErrorTransformer({
    errorMap: errorMapBuilder,
    moduleName: 'user-service',
});

try {
    // Some operation that might throw
    throw new Error('User not found');
} catch (error) {
    transformer.transform(error, {
        layer: 'SERVICE',
        className: 'UserService',
        methodName: 'getUserById',
    });
}
```

##### `withAsyncTransform<T>(fn: () => Promise<T>, context?: ErrorContextBase): () => Promise<T>`

Wraps an async function with error transformation.

**Parameters:**

-   `fn` - Async function to wrap
-   `context` - Optional context for error transformation

**Returns:** Wrapped async function

**Example:**

```typescript
const wrappedFunction = transformer.withAsyncTransform(
    async () => {
        // Async operation
        return await someAsyncOperation();
    },
    { layer: 'SERVICE', className: 'UserService' }
);
```

##### `withSyncTransform<T>(fn: () => T, context?: ErrorContextBase): () => T`

Wraps a sync function with error transformation.

**Parameters:**

-   `fn` - Sync function to wrap
-   `context` - Optional context for error transformation

**Returns:** Wrapped sync function

### ErrorMapBuilder

Builds error mapping configurations for the ErrorTransformer.

```typescript
class ErrorMapBuilder
```

#### Constructor

```typescript
constructor(config: ErrorMapBuilderConfig)
```

**Parameters:**

-   `config.globalProperty` - Property to match against (e.g., 'message')
-   `config.rollbackError` - Error to throw when no mapping matches

#### Methods

##### `equals(value: string): ErrorMapBuilder`

Adds an exact string match condition.

**Parameters:**

-   `value` - Exact string to match

**Returns:** `ErrorMapBuilder` - Fluent interface for chaining

**Example:**

```typescript
errorMapBuilder.equals('User not found').throwString('USER_NOT_FOUND');
```

##### `includes(values: string[]): ErrorMapBuilder`

Adds a partial match condition requiring all keywords.

**Parameters:**

-   `values` - Array of keywords that must all be present

**Returns:** `ErrorMapBuilder` - Fluent interface for chaining

**Example:**

```typescript
errorMapBuilder
    .includes(['validation', 'failed'])
    .throwErrorInstance(new ValidationError({ code: 'VALIDATION_FAILED' }));
```

##### `matches(regex: RegExp): ErrorMapBuilder`

Adds a regex pattern match condition.

**Parameters:**

-   `regex` - Regular expression pattern

**Returns:** `ErrorMapBuilder` - Fluent interface for chaining

**Example:**

```typescript
errorMapBuilder.matches(/^HTTP \d{3}:/).throwString('HTTP_ERROR');
```

##### `throwString(errorCode: string): ErrorMapBuilder`

Sets the output action to throw a string error code.

**Parameters:**

-   `errorCode` - String error code to throw

**Returns:** `ErrorMapBuilder` - Fluent interface for chaining

##### `throwErrorInstance(error: ErrorInstance): ErrorMapBuilder`

Sets the output action to throw an error instance.

**Parameters:**

-   `error` - Error instance to throw

**Returns:** `ErrorMapBuilder` - Fluent interface for chaining

## Error Types

### ValidationError

Error for input validation failures.

```typescript
class ValidationError extends CustomError
```

**Status Code:** 400  
**Category:** VALIDATION  
**Operational:** true

#### Constructor

```typescript
constructor(options: ValidationErrorOptions)
```

**Parameters:**

-   `options.code` - Error code
-   `options.message?` - Error message
-   `options.context?` - Validation context including:
    -   `providedValueType?` - Type of provided value
    -   `providedValue?` - Actual value provided
    -   `expectedValueType?` - Expected value type
    -   `expectedValueExample?` - Example of expected value
    -   `path?` - Path to the invalid field
    -   `constraint?` - Validation constraint that failed

### AuthenticationError

Error for authentication failures.

```typescript
class AuthenticationError extends CustomError
```

**Status Code:** 401  
**Category:** AUTHENTICATION  
**Operational:** true

#### Constructor

```typescript
constructor(options: AuthenticationErrorOptions)
```

**Parameters:**

-   `options.code` - Error code
-   `options.message?` - Error message
-   `options.context?` - Authentication context including:
    -   `authMethod?` - Authentication method used
    -   `userId?` - User ID if available
    -   `tokenType?` - Type of token (JWT, API key, etc.)

### AuthorizationError

Error for authorization/permission failures.

```typescript
class AuthorizationError extends CustomError
```

**Status Code:** 403  
**Category:** AUTHORIZATION  
**Operational:** true

#### Constructor

```typescript
constructor(options: AuthorizationErrorOptions)
```

**Parameters:**

-   `options.code` - Error code
-   `options.message?` - Error message
-   `options.context?` - Authorization context including:
    -   `requiredPermission?` - Required permission
    -   `userRole?` - User's role
    -   `resource?` - Resource being accessed

### NotFoundError

Error for resource not found scenarios.

```typescript
class NotFoundError extends CustomError
```

**Status Code:** 404  
**Category:** NOT_FOUND  
**Operational:** true

#### Constructor

```typescript
constructor(options: NotFoundErrorOptions)
```

**Parameters:**

-   `options.code` - Error code
-   `options.message?` - Error message
-   `options.context?` - Context including:
    -   `resourceType?` - Type of resource not found
    -   `resourceId?` - ID of the resource
    -   `searchCriteria?` - Criteria used for search

### ConflictError

Error for resource conflicts.

```typescript
class ConflictError extends CustomError
```

**Status Code:** 409  
**Category:** CONFLICT  
**Operational:** true

#### Constructor

```typescript
constructor(options: ConflictErrorOptions)
```

**Parameters:**

-   `options.code` - Error code
-   `options.message?` - Error message
-   `options.context?` - Conflict context including:
    -   `conflictingResource?` - Resource causing conflict
    -   `conflictType?` - Type of conflict
    -   `existingValue?` - Existing value causing conflict

### ExternalServiceError

Error for external service failures.

```typescript
class ExternalServiceError extends CustomError
```

**Status Code:** 502  
**Category:** EXTERNAL_SERVICE  
**Operational:** true

#### Constructor

```typescript
constructor(options: ExternalServiceErrorOptions)
```

**Parameters:**

-   `options.code` - Error code
-   `options.message?` - Error message
-   `options.externalService` - Name of the external service
-   `options.context?` - External service context including:
    -   `serviceUrl?` - URL of the external service
    -   `requestId?` - Request ID for tracing
    -   `responseStatus?` - HTTP status from external service

### InternalError

Error for internal server errors.

```typescript
class InternalError extends CustomError
```

**Status Code:** 500  
**Category:** INTERNAL  
**Operational:** false

#### Constructor

```typescript
constructor(options: InternalErrorOptions)
```

**Parameters:**

-   `options.code` - Error code
-   `options.message?` - Error message
-   `options.context?` - Internal error context including:
    -   `component?` - Component where error occurred
    -   `operation?` - Operation being performed
    -   `originalError?` - Original error that caused this

## Middleware

### ExpressErrorHandlerMiddleware

Express.js global error handler middleware.

```typescript
class ExpressErrorHandlerMiddleware
```

#### Constructor

```typescript
constructor(options?: ExpressErrorHandlerOptions)
```

**Parameters:**

-   `options.serviceName?` - Name of the service (default: process.env.SERVICE_NAME)
-   `options.traceIdHeader?` - Header name for trace ID (default: 'x-trace-id')
-   `options.includeRequestBody?` - Include request body in error context (default: false)
-   `options.maxBodySize?` - Maximum body size to include (default: 1024)
-   `options.enableLogging?` - Enable error logging (default: true)
-   `options.logger?` - Logger instance (default: console)

#### Methods

##### `handler(error: Error, req: Request, res: Response, next: NextFunction): void`

Express error handler function.

**Parameters:**

-   `error` - The error to handle
-   `req` - Express request object
-   `res` - Express response object
-   `next` - Express next function

### NestJSGlobalExceptionFilter

NestJS global exception filter.

```typescript
@Catch()
class NestJSGlobalExceptionFilter implements ExceptionFilter
```

#### Constructor

```typescript
constructor(options?: NestJSExceptionFilterOptions)
```

**Parameters:**

-   `options.serviceName?` - Name of the service
-   `options.traceIdHeader?` - Header name for trace ID
-   `options.includeRequestBody?` - Include request body in error context
-   `options.maxBodySize?` - Maximum body size to include
-   `options.enableLogging?` - Enable error logging
-   `options.logger?` - Logger instance

#### Methods

##### `catch(exception: unknown, host: ArgumentsHost): void`

NestJS exception handler.

**Parameters:**

-   `exception` - The exception to handle
-   `host` - NestJS arguments host

## Decorators

### @AsyncTransform

Method decorator for async method error transformation.

```typescript
function AsyncTransform(context?: Partial<ErrorContextBase>): MethodDecorator;
```

**Parameters:**

-   `context` - Optional context to include in error transformations

**Example:**

```typescript
class UserService {
    private errorTransformer = new ErrorTransformer({
        errorMap: errorMapBuilder,
        moduleName: 'user-service',
    });

    @AsyncTransform({
        layer: 'SERVICE',
        className: 'UserService',
    })
    async getUserById(id: string): Promise<User> {
        // Method implementation
    }
}
```

### @SyncTransform

Method decorator for sync method error transformation.

```typescript
function SyncTransform(context?: Partial<ErrorContextBase>): MethodDecorator;
```

**Parameters:**

-   `context` - Optional context to include in error transformations

**Example:**

```typescript
class UserService {
    @SyncTransform({
        layer: 'SERVICE',
        className: 'UserService',
    })
    validateUser(user: User): void {
        // Method implementation
    }
}
```

## Types & Interfaces

### IError

Core error interface.

```typescript
interface IError {
    code: string;
    traceId?: string;
    statusCode?: number;
    serviceName?: string;
    isOperational: boolean;
    timestamp: Date;
    category: ErrorCategoryEnum;
    message?: string;
    context?: ErrorContextBase;
    stack?: string;
}
```

### ErrorContextBase

Base context interface for errors.

```typescript
type ErrorContextBase = {
    layer?: ErrorLayerEnum | ErrorLayerType;
    className?: string;
    methodName?: string;
    transformerModuleName?: string;
    originalError?: Error;
} & Record<string, any>;
```

### ErrorOptions

Base options for error creation.

```typescript
type ErrorOptions = Omit<IError, 'category' | 'isOperational' | 'timestamp'>;
```

## Enums

### ErrorCategoryEnum

Error category enumeration.

```typescript
enum ErrorCategoryEnum {
    VALIDATION = 'VALIDATION',
    AUTHENTICATION = 'AUTHENTICATION',
    AUTHORIZATION = 'AUTHORIZATION',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
    INTERNAL = 'INTERNAL',
}
```

### ErrorLayerEnum

Error layer enumeration.

```typescript
enum ErrorLayerEnum {
    CONTROLLER = 'CONTROLLER',
    SERVICE = 'SERVICE',
    REPOSITORY = 'REPOSITORY',
    DATABASE = 'DATABASE',
    APP = 'APP',
    FRAMEWORK = 'FRAMEWORK',
    INFRASTRUCTURE = 'INFRASTRUCTURE',
    EXTERNAL = 'EXTERNAL',
    API = 'API',
    THIRD_PARTY = 'THIRD_PARTY',
}
```

## Utilities

### ErrorFactory

Factory for creating error instances.

```typescript
class ErrorFactory {
    constructor(options?: ErrorFactoryOptions);

    createValidationError(options: ValidationErrorOptions): ValidationError;
    createAuthenticationError(options: AuthenticationErrorOptions): AuthenticationError;
    createAuthorizationError(options: AuthorizationErrorOptions): AuthorizationError;
    createNotFoundError(options: NotFoundErrorOptions): NotFoundError;
    createConflictError(options: ConflictErrorOptions): ConflictError;
    createExternalServiceError(options: ExternalServiceErrorOptions): ExternalServiceError;
    createInternalError(options: InternalErrorOptions): InternalError;
}
```

### StackHelper

Utility for stack trace manipulation.

```typescript
class StackHelper {
    static getStack(): string;
    static filterStack(stack: string): string;
    static getCallerInfo(stack: string): CallerInfo;
}
```

### Console

Enhanced console utility for error logging.

```typescript
class Console {
    static error(error: Error, context?: ErrorContextBase): void;
    static warn(message: string, context?: ErrorContextBase): void;
    static info(message: string, context?: ErrorContextBase): void;
    static debug(message: string, context?: ErrorContextBase): void;
}
```
