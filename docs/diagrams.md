# Error Handler Package Diagrams

This document contains detailed Mermaid diagrams for the @lazy-js/error-guard package.

## Package Architecture

### High-Level Package Structure

```mermaid
graph TB
    subgraph "Error Handler Package"
        A[Core] --> B[Error Classes]
        A --> C[ErrorTransformer]
        A --> D[ErrorMapBuilder]
        A --> E[ErrorFactory]

        F[Middleware] --> G[ExpressErrorHandler]
        F --> H[NestJSExceptionFilter]

        I[Decorators] --> J[AsyncTransform]
        I --> K[SyncTransform]
        I --> L[CustomValidators]

        M[Types] --> N[Error Interfaces]
        M --> O[Context Types]
        M --> P[Framework Types]

        Q[Enums] --> R[Error Categories]
        Q --> S[Error Layers]
        Q --> T[Error Codes]
    end

    subgraph "External Dependencies"
        U[class-transformer]
        V[class-validator]
        W[zod]
    end

    A --> U
    A --> V
    A --> W
```

### Detailed Class Hierarchy

```mermaid
classDiagram
    class IError {
        <<interface>>
        +code: string
        +traceId?: string
        +statusCode?: number
        +serviceName?: string
        +isOperational: boolean
        +timestamp: Date
        +category: ErrorCategoryEnum
        +message?: string
        +context?: ErrorContextBase
        +stack?: string
    }

    class CustomError {
        <<abstract>>
        +code: string
        +traceId?: string
        +statusCode: number
        +serviceName?: string
        +isOperational: boolean
        +timestamp: Date
        +category: ErrorCategoryEnum
        +message?: string
        +context?: ErrorContextBase
        +stack?: string
        +toJSON(): object
        +toString(): string
        +updateTimestamp(): void
    }

    class ValidationError {
        +statusCode: 400
        +category: VALIDATION
        +isOperational: true
    }

    class AuthenticationError {
        +statusCode: 401
        +category: AUTHENTICATION
        +isOperational: true
    }

    class AuthorizationError {
        +statusCode: 403
        +category: AUTHORIZATION
        +isOperational: true
    }

    class NotFoundError {
        +statusCode: 404
        +category: NOT_FOUND
        +isOperational: true
    }

    class ConflictError {
        +statusCode: 409
        +category: CONFLICT
        +isOperational: true
    }

    class ExternalServiceError {
        +statusCode: 502
        +category: EXTERNAL_SERVICE
        +isOperational: true
    }

    class InternalError {
        +statusCode: 500
        +category: INTERNAL
        +isOperational: false
    }

    IError <|-- CustomError
    CustomError <|-- ValidationError
    CustomError <|-- AuthenticationError
    CustomError <|-- AuthorizationError
    CustomError <|-- NotFoundError
    CustomError <|-- ConflictError
    CustomError <|-- ExternalServiceError
    CustomError <|-- InternalError
```

## Error Transformation Flow

### Basic Error Transformation Sequence

```mermaid
sequenceDiagram
    participant App as Application
    participant ET as ErrorTransformer
    participant EMB as ErrorMapBuilder
    participant EC as Error Classes
    participant MW as Middleware

    App->>ET: transform(error, context)
    ET->>ET: Extract error message
    ET->>EMB: Check error mappings

    alt Error matches mapping
        EMB-->>ET: Return mapped error
        ET->>EC: Create specific error instance
        EC-->>ET: Error instance
        ET-->>App: Throw transformed error
    else No mapping found
        EMB-->>ET: Return rollback error
        ET->>EC: Create InternalError
        EC-->>ET: InternalError instance
        ET-->>App: Throw rollback error
    end

    App->>MW: Error reaches middleware
    MW->>MW: Format error response
    MW-->>App: Standardized JSON response
```

### Error Map Building Process

```mermaid
flowchart TD
    A[Start Error Map Building] --> B[Create ErrorMapBuilder]
    B --> C[Set Global Property]
    C --> D[Set Rollback Error]
    D --> E[Add Error Mappings]

    E --> F{Mapping Type?}
    F -->|equals| G[Add Exact Match]
    F -->|includes| H[Add Partial Match]
    F -->|matches| I[Add Regex Match]

    G --> J[Set Output Action]
    H --> J
    I --> J

    J --> K{More Mappings?}
    K -->|Yes| E
    K -->|No| L[Build Error Map]
    L --> M[Return ErrorMapBuilder]
```

### Error Context Flow

```mermaid
graph LR
    A[Original Error] --> B[Extract Context]
    B --> C[Add Layer Info]
    C --> D[Add Class/Method Info]
    D --> E[Add Custom Context]
    E --> F[Merge Contexts]
    F --> G[Create Error Instance]
    G --> H[Return Enhanced Error]
```

## Framework Integration

### Express.js Integration Flow

```mermaid
sequenceDiagram
    participant Client as HTTP Client
    participant Express as Express App
    participant Route as Route Handler
    participant ET as ErrorTransformer
    participant MW as ErrorHandlerMiddleware
    participant Response as HTTP Response

    Client->>Express: HTTP Request
    Express->>Route: Route Handler
    Route->>ET: transform(error, context)
    ET-->>Route: Throw transformed error
    Route-->>Express: Unhandled error
    Express->>MW: Error middleware
    MW->>MW: Format error response
    MW->>Response: Send JSON response
    Response-->>Client: Error response
```

### NestJS Integration Flow

```mermaid
sequenceDiagram
    participant Client as HTTP Client
    participant NestJS as NestJS App
    participant Controller as Controller
    participant Service as Service
    participant Filter as ExceptionFilter
    participant Response as HTTP Response

    Client->>NestJS: HTTP Request
    NestJS->>Controller: Controller method
    Controller->>Service: Service method
    Service-->>Controller: Throw error
    Controller-->>NestJS: Unhandled exception
    NestJS->>Filter: Global exception filter
    Filter->>Filter: Transform error
    Filter->>Response: Send error response
    Response-->>Client: Error response
```

## Error Layers Architecture

### Error Layer Hierarchy

```mermaid
graph TB
    subgraph "Application Layers"
        A[CONTROLLER] --> B[SERVICE]
        B --> C[REPOSITORY]
        C --> D[DATABASE]
    end

    subgraph "Infrastructure Layers"
        E[APP] --> F[FRAMEWORK]
        F --> G[INFRASTRUCTURE]
    end

    subgraph "External Layers"
        H[EXTERNAL] --> I[API]
        I --> J[THIRD_PARTY]
    end

    A --> E
    B --> E
    C --> E
    D --> E
```

### Error Flow Through Layers

```mermaid
flowchart TD
    A[Error Occurs] --> B{Which Layer?}

    B -->|CONTROLLER| C[Controller Error]
    B -->|SERVICE| D[Service Error]
    B -->|REPOSITORY| E[Repository Error]
    B -->|DATABASE| F[Database Error]
    B -->|EXTERNAL| G[External Service Error]

    C --> H[Add Controller Context]
    D --> I[Add Service Context]
    E --> J[Add Repository Context]
    F --> K[Add Database Context]
    G --> L[Add External Context]

    H --> M[Transform Error]
    I --> M
    J --> M
    K --> M
    L --> M

    M --> N[Log Error]
    N --> O[Return to Client]
```

## Decorator Pattern Implementation

### Decorator Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant Decorator as @AsyncTransform
    participant ET as ErrorTransformer
    participant Method as Decorated Method
    participant Error as Error Instance

    App->>Decorator: Call decorated method
    Decorator->>ET: Setup error context
    ET-->>Decorator: Context ready
    Decorator->>Method: Execute method

    alt Method succeeds
        Method-->>Decorator: Return result
        Decorator-->>App: Return result
    else Method throws error
        Method-->>Decorator: Throw error
        Decorator->>ET: Transform error
        ET->>Error: Create error instance
        Error-->>ET: Error instance
        ET-->>Decorator: Transformed error
        Decorator-->>App: Throw transformed error
    end
```

### Decorator Class Structure

```mermaid
classDiagram
    class MethodDecorator {
        <<interface>>
        +apply(target, propertyKey, descriptor)
    }

    class AsyncTransform {
        +context?: ErrorContextBase
        +apply(target, propertyKey, descriptor)
        -wrapAsyncMethod(fn, context)
    }

    class SyncTransform {
        +context?: ErrorContextBase
        +apply(target, propertyKey, descriptor)
        -wrapSyncMethod(fn, context)
    }

    class ErrorTransformer {
        +transform(error, context)
        +withAsyncTransform(fn, context)
        +withSyncTransform(fn, context)
    }

    MethodDecorator <|-- AsyncTransform
    MethodDecorator <|-- SyncTransform
    AsyncTransform --> ErrorTransformer
    SyncTransform --> ErrorTransformer
```

## Error Map Configuration

### Error Map Structure

```mermaid
graph TB
    A[ErrorMapBuilder] --> B[Global Property]
    A --> C[Rollback Error]
    A --> D[Error Mappings]

    D --> E[Input Conditions]
    D --> F[Output Actions]

    E --> G[equals]
    E --> H[includes]
    E --> I[matches]

    F --> J[throwString]
    F --> K[throwErrorInstance]

    G --> L[Exact Match]
    H --> M[Partial Match]
    I --> N[Regex Match]

    J --> O[String Error Code]
    K --> P[Error Instance]
```

### Error Matching Process

```mermaid
flowchart TD
    A[Error Input] --> B[Extract Property Value]
    B --> C[Check Error Mappings]

    C --> D{Match Type?}
    D -->|equals| E[Exact String Match]
    D -->|includes| F[Contains All Keywords]
    D -->|matches| G[Regex Pattern Match]

    E --> H{Match Found?}
    F --> H
    G --> H

    H -->|Yes| I[Execute Output Action]
    H -->|No| J[Check Next Mapping]

    I --> K{Output Type?}
    K -->|throwString| L[Throw String Code]
    K -->|throwErrorInstance| M[Throw Error Instance]

    J --> N{More Mappings?}
    N -->|Yes| C
    N -->|No| O[Use Rollback Error]

    L --> P[Error Thrown]
    M --> P
    O --> P
```

## Testing Architecture

### Test Structure

```mermaid
graph TB
    subgraph "Test Suite"
        A[Unit Tests] --> B[Error Classes]
        A --> C[ErrorTransformer]
        A --> D[ErrorMapBuilder]
        A --> E[Decorators]

        F[Integration Tests] --> G[Express Middleware]
        F --> H[NestJS Filter]
        F --> I[End-to-End Scenarios]

        J[Test Utilities] --> K[Test Setup]
        J --> L[Mock Data]
        J --> M[Helper Functions]
    end

    subgraph "Test Tools"
        N[Vitest]
        O[TypeScript]
        P[Mock Functions]
    end

    A --> N
    F --> N
    J --> N
    A --> O
    F --> O
    J --> O
```

This comprehensive set of diagrams provides a complete visual understanding of the error handler package architecture, data flow, and integration patterns.
