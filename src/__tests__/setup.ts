import { InternalError, ValidationError } from '../';
import { ErrorTransformer, ErrorMapBuilder } from '../';

const defaultError = new InternalError({
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error',
});

export const errorMessage = 'Test error';

// Create error map using builder
const errorMapBuilder = new ErrorMapBuilder({
    globalProperty: 'message',
    rollbackError: defaultError,
});

errorMapBuilder.equals(errorMessage).throwErrorInstance(
    new ValidationError({
        code: 'VALIDATION_ERROR',
    })
);

export const testErrorTransformer = new ErrorTransformer({
    errorMap: errorMapBuilder,
    moduleName: 'test_module',
});
