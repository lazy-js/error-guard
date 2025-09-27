# Quick Start Guide

## Installation

```bash
npm install @lazy-js/error-guard
```

## Basic Usage

### 1. Create Error Instances

```typescript
import { ValidationError, NotFoundError, InternalError } from '@lazy-js/error-guard';

// Create a validation error
const validationError = new ValidationError({
    code: 'INVALID_EMAIL',
    message: 'Email format is invalid',
    context: {
        layer: 'SERVICE',
        className: 'UserService',
        methodName: 'validateEmail',
        providedValue: 'invalid-email',
        expectedValueType: 'email',
    },
});

// Create a not found error
const notFoundError = new NotFoundError({
    code: 'USER_NOT_FOUND',
    message: 'User with ID 123 not found',
    context: {
        resourceType: 'User',
        resourceId: '123',
    },
});
```

### 2. Set Up Error Transformation

```typescript
import { ErrorTransformer, ErrorMapBuilder } from '@lazy-js/error-guard';

// Create error map
const errorMapBuilder = new ErrorMapBuilder({
    globalProperty: 'message',
    rollbackError: new InternalError({ code: 'UNKNOWN_ERROR' }),
});

// Add mappings
errorMapBuilder
    .equals('User not found')
    .throwString('USER_NOT_FOUND')
    .includes(['validation', 'failed'])
    .throwErrorInstance(validationError)
    .matches(/^HTTP \d{3}:/)
    .throwString('HTTP_ERROR');

// Create transformer
const transformer = new ErrorTransformer({
    errorMap: errorMapBuilder,
    moduleName: 'user-service',
});
```

### 3. Express.js Integration

```typescript
import express from 'express';
import { ExpressErrorHandlerMiddleware } from '@lazy-js/error-guard';

const app = express();

// Configure error handler
const errorHandler = new ExpressErrorHandlerMiddleware({
    serviceName: 'my-api',
    traceIdHeader: 'x-trace-id',
    includeRequestBody: true,
    maxBodySize: 2048,
});

// Use as global error handler
app.use(errorHandler.handler);

// Your routes
app.get('/users/:id', async (req, res) => {
    // This will be caught by the error handler
    throw new NotFoundError({
        code: 'USER_NOT_FOUND',
        message: `User with ID ${req.params.id} not found`,
    });
});

app.listen(3000);
```

### 4. NestJS Integration

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { NestJSGlobalExceptionFilter } from '@lazy-js/error-guard';

@Module({
    providers: [
        {
            provide: APP_FILTER,
            useClass: NestJSGlobalExceptionFilter,
        },
    ],
})
export class AppModule {}
```

### 5. Using Decorators

```typescript
import { AsyncTransform, SyncTransform } from '@lazy-js/error-guard';

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
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    @SyncTransform({
        layer: 'SERVICE',
        className: 'UserService',
    })
    validateUserData(userData: any): void {
        if (!userData.email) {
            throw new Error('Email is required');
        }
    }
}
```

## Error Response Format

All errors are returned in a standardized JSON format:

```json
{
    "error": {
        "code": "USER_NOT_FOUND",
        "message": "User with ID 123 not found",
        "statusCode": 404,
        "category": "NOT_FOUND",
        "isOperational": true,
        "timestamp": "2024-01-01T00:00:00.000Z",
        "traceId": "trace-123",
        "serviceName": "my-api",
        "context": {
            "layer": "SERVICE",
            "className": "UserService",
            "methodName": "getUserById",
            "resourceType": "User",
            "resourceId": "123"
        }
    },
    "request": {
        "method": "GET",
        "url": "/users/123",
        "headers": {
            "x-trace-id": "trace-123"
        }
    }
}
```

## Next Steps

-   Read the [full API documentation](./API.md)
-   Check out the [architecture diagrams](./diagrams.md)
-   Explore the [complete README](../README.md)
-   Run the tests: `npm test`
