import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorTransformer, ErrorMapBuilder } from '../';
import { ValidationError, ConflictError, ExternalServiceError, NotFoundError, InternalError, NetworkError } from '../';
import { ErrorLayerEnum, ErrorConstructorEnum } from '../';

const defaultError = new InternalError({
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error',
});

describe('ErrorTransformer', () => {
    let errorTransformer: ErrorTransformer;
    let mockErrorMapBuilder: ErrorMapBuilder;

    beforeEach(() => {
        // Reset error map for each test
        mockErrorMapBuilder = new ErrorMapBuilder({
            globalProperty: 'message',
            rollbackError: defaultError,
        });
        errorTransformer = new ErrorTransformer({
            errorMap: mockErrorMapBuilder,
            moduleName: 'test_module',
        });
    });

    describe('Constructor', () => {
        it('should initialize with empty error map', () => {
            const emptyBuilder = new ErrorMapBuilder({
                globalProperty: 'message',
                rollbackError: defaultError,
            });
            const transformer = new ErrorTransformer({
                errorMap: emptyBuilder,
                moduleName: 'test_module',
            });
            expect(transformer).toBeInstanceOf(ErrorTransformer);
        });

        it('should initialize with provided error map', () => {
            const errorMapBuilder = new ErrorMapBuilder({
                globalProperty: 'message',
                rollbackError: defaultError,
            });

            errorMapBuilder.equals('Test error').throwString('TEST_ERROR');

            const transformer = new ErrorTransformer({
                errorMap: errorMapBuilder,
                moduleName: 'test_module',
            });
            expect(transformer).toBeInstanceOf(ErrorTransformer);
        });
    });

    describe('Error Input Matching', () => {
        describe('includes condition', () => {
            beforeEach(() => {
                mockErrorMapBuilder = new ErrorMapBuilder({
                    globalProperty: 'message',
                    rollbackError: defaultError,
                });

                mockErrorMapBuilder
                    .includes(['sibling group', 'already exists'])
                    .throwString('SUB_GROUP_ALREADY_EXISTS');

                errorTransformer = new ErrorTransformer({
                    errorMap: mockErrorMapBuilder,
                    moduleName: 'test_module',
                });
            });

            it('should match error message containing all required parts', () => {
                const error = new Error('sibling group already exists');

                expect(() => {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                }).toThrow('SUB_GROUP_ALREADY_EXISTS');
            });

            it('should match error message with different case', () => {
                const error = new Error('SIBLING GROUP ALREADY EXISTS');

                expect(() => {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                }).toThrow('SUB_GROUP_ALREADY_EXISTS');
            });

            it('should not match error message missing required parts', () => {
                const error = new Error('group already exists');

                expect(() => {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                }).toThrow(InternalError);
            });

            it('should not match error message with partial match', () => {
                const error = new Error('sibling group');

                expect(() => {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                }).toThrow(InternalError);
            });
        });

        describe('equals condition', () => {
            beforeEach(() => {
                mockErrorMapBuilder = new ErrorMapBuilder({
                    globalProperty: 'message',
                    rollbackError: defaultError,
                });

                mockErrorMapBuilder.equals('Validation error').throwString('VALIDATION_ERROR');

                errorTransformer = new ErrorTransformer({
                    errorMap: mockErrorMapBuilder,
                    moduleName: 'test_module',
                });
            });

            it('should match exact error message', () => {
                const error = new Error('Validation error');

                expect(() => {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                }).toThrow('VALIDATION_ERROR');
            });

            it('should not match similar error message', () => {
                const error = new Error('validation error');

                expect(() => {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                }).toThrow(InternalError);
            });

            it('should not match error message with extra text', () => {
                const error = new Error('Validation error occurred');

                expect(() => {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                }).toThrow(InternalError);
            });
        });

        describe('matches condition', () => {
            beforeEach(() => {
                mockErrorMapBuilder = new ErrorMapBuilder({
                    globalProperty: 'message',
                    rollbackError: defaultError,
                });

                mockErrorMapBuilder.matches(/^User \d+ not found$/).throwString('USER_NOT_FOUND');

                errorTransformer = new ErrorTransformer({
                    errorMap: mockErrorMapBuilder,
                    moduleName: 'test_module',
                });
            });

            it('should match error message with regex', () => {
                const error = new Error('User 123 not found');

                expect(() => {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                }).toThrow('USER_NOT_FOUND');
            });

            it("should not match error message that doesn't match regex", () => {
                const error = new Error('User not found');

                expect(() => {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                }).toThrow(InternalError);
            });
        });
    });

    describe('Error Output Handling', () => {
        describe('String output type', () => {
            beforeEach(() => {
                mockErrorMapBuilder = new ErrorMapBuilder({
                    globalProperty: 'message',
                    rollbackError: defaultError,
                });

                mockErrorMapBuilder.equals('Test error').throwString('TEST_ERROR_CODE');

                errorTransformer = new ErrorTransformer({
                    errorMap: mockErrorMapBuilder,
                    moduleName: 'test_module',
                });
            });

            it('should throw string code when matched', () => {
                const error = new Error('Test error');

                expect(() => {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                }).toThrow('TEST_ERROR_CODE');
            });
        });

        describe('ErrorInstance output type', () => {
            beforeEach(() => {
                const validationError = new ValidationError({
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    context: {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                        providedValueType: 'string',
                        providedValue: 'invalid',
                        expectedValueType: 'number',
                        expectedValueExample: 123,
                        path: 'user.age',
                        constraint: 'type',
                    },
                });

                mockErrorMapBuilder = new ErrorMapBuilder({
                    globalProperty: 'message',
                    rollbackError: defaultError,
                });

                mockErrorMapBuilder.equals('Validation error').throwErrorInstance(validationError);

                errorTransformer = new ErrorTransformer({
                    errorMap: mockErrorMapBuilder,
                    moduleName: 'test_module',
                });
            });

            it('should throw ErrorInstance when matched', () => {
                const error = new Error('Validation error');

                expect(() => {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                }).toThrow(ValidationError);
            });

            it('should preserve error instance properties', () => {
                const error = new Error('Validation error');

                try {
                    errorTransformer.transform(error, {
                        layer: ErrorLayerEnum.APP,
                        className: 'TestClass',
                        methodName: 'testMethod',
                    });
                } catch (thrownError) {
                    expect(thrownError).toBeInstanceOf(ValidationError);
                    expect((thrownError as ValidationError).code).toBe('VALIDATION_ERROR');
                    expect((thrownError as ValidationError).message).toBe('Validation failed');
                }
            });
        });
    });

    describe('Multiple Error Maps', () => {
        beforeEach(() => {
            mockErrorMapBuilder = new ErrorMapBuilder({
                globalProperty: 'message',
                rollbackError: defaultError,
            });

            mockErrorMapBuilder
                .includes(['sibling group', 'already exists'])
                .throwString('SUB_GROUP_ALREADY_EXISTS')
                .equals('Validation error')
                .throwString('VALIDATION_ERROR')
                .matches(/^User \d+ not found$/)
                .throwString('USER_NOT_FOUND');

            errorTransformer = new ErrorTransformer({
                errorMap: mockErrorMapBuilder,
                moduleName: 'test_module',
            });
        });

        it('should match first applicable error map', () => {
            const error = new Error('sibling group already exists');

            expect(() => {
                errorTransformer.transform(error, {
                    layer: ErrorLayerEnum.APP,
                    className: 'TestClass',
                    methodName: 'testMethod',
                });
            }).toThrow('SUB_GROUP_ALREADY_EXISTS');
        });

        it("should match second error map when first doesn't match", () => {
            const error = new Error('Validation error');

            expect(() => {
                errorTransformer.transform(error, {
                    layer: ErrorLayerEnum.APP,
                    className: 'TestClass',
                    methodName: 'testMethod',
                });
            }).toThrow('VALIDATION_ERROR');
        });

        it("should match third error map when first two don't match", () => {
            const error = new Error('User 123 not found');

            expect(() => {
                errorTransformer.transform(error, {
                    layer: ErrorLayerEnum.APP,
                    className: 'TestClass',
                    methodName: 'testMethod',
                });
            }).toThrow('USER_NOT_FOUND');
        });
    });

    describe('No Matching Error Map', () => {
        beforeEach(() => {
            mockErrorMapBuilder = new ErrorMapBuilder({
                globalProperty: 'message',
                rollbackError: defaultError,
            });

            mockErrorMapBuilder.equals('Specific error').throwString('SPECIFIC_ERROR');

            errorTransformer = new ErrorTransformer({
                errorMap: mockErrorMapBuilder,
                moduleName: 'test_module',
            });
        });

        it('should throw InternalError when no error map matches', () => {
            const error = new Error('Unknown error');

            expect(() => {
                errorTransformer.transform(error, {
                    layer: ErrorLayerEnum.APP,
                    className: 'TestClass',
                    methodName: 'testMethod',
                });
            }).toThrow(InternalError);
        });

        it('should include original error in context when no match', () => {
            const error = new Error('Unknown error');
            const context = {
                layer: ErrorLayerEnum.APP,
                className: 'TestClass',
                methodName: 'testMethod',
            };

            try {
                errorTransformer.transform(error, context);
            } catch (thrownError) {
                expect(thrownError).toBeInstanceOf(InternalError);
                expect((thrownError as InternalError).code).toBe(defaultError.code);
                expect((thrownError as InternalError).context).toMatchObject(context);
                expect((thrownError as InternalError).context?.originalError).toBeDefined();
            }
        });
    });

    describe('Context Handling', () => {
        beforeEach(() => {
            const validationError = new ValidationError({
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                context: {
                    layer: ErrorLayerEnum.APP,
                    className: 'OriginalClass',
                    methodName: 'originalMethod',
                },
            });

            mockErrorMapBuilder = new ErrorMapBuilder({
                globalProperty: 'message',
                rollbackError: defaultError,
            });

            mockErrorMapBuilder.equals('Validation error').throwErrorInstance(validationError);

            errorTransformer = new ErrorTransformer({
                errorMap: mockErrorMapBuilder,
                moduleName: 'test_module',
            });
        });

        it('should merge provided context with error context', () => {
            const error = new Error('Validation error');
            const newContext = {
                layer: ErrorLayerEnum.SERVICE,
                className: 'UserService',
                methodName: 'validateUser',
                userId: '123',
            };

            try {
                errorTransformer.transform(error, newContext);
            } catch (thrownError) {
                expect((thrownError as ValidationError).context).toMatchObject({
                    ...newContext,
                });
            }
        });
    });

    describe('withAsyncTransform', () => {
        beforeEach(() => {
            mockErrorMapBuilder = new ErrorMapBuilder({
                globalProperty: 'message',
                rollbackError: defaultError,
            });

            mockErrorMapBuilder.equals('Async error').throwString('ASYNC_ERROR');

            errorTransformer = new ErrorTransformer({
                errorMap: mockErrorMapBuilder,
                moduleName: 'test_module',
            });
        });

        it('should transform async function errors', async () => {
            const asyncFunction = vi.fn().mockRejectedValue(new Error('Async error'));
            const wrappedFunction = errorTransformer.withAsyncTransform(asyncFunction, {
                layer: ErrorLayerEnum.APP,
                className: 'TestClass',
                methodName: 'testMethod',
            });

            await expect(wrappedFunction()).rejects.toThrow('ASYNC_ERROR');
        });

        it('should not transform non-Error objects', async () => {
            const asyncFunction = vi.fn().mockRejectedValue('String error');
            const wrappedFunction = errorTransformer.withAsyncTransform(asyncFunction, {
                layer: ErrorLayerEnum.APP,
                className: 'TestClass',
                methodName: 'testMethod',
            });

            await expect(wrappedFunction()).rejects.toThrow(InternalError);
        });

        it('should pass through successful async function results', async () => {
            const asyncFunction = vi.fn().mockResolvedValue('Success');
            const wrappedFunction = errorTransformer.withAsyncTransform(asyncFunction, {
                layer: ErrorLayerEnum.APP,
                className: 'TestClass',
                methodName: 'testMethod',
            });

            const result = await wrappedFunction();
            expect(result).toBe('Success');
        });

        it('should pass through successful sync function results', () => {
            const syncFunction = vi.fn().mockReturnValue('Success');
            const wrappedFunction = errorTransformer.withSyncTransform(syncFunction, {
                layer: ErrorLayerEnum.APP,
                className: 'TestClass',
                methodName: 'testMethod',
            });

            const result = wrappedFunction();
            expect(result).toBe('Success');
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            mockErrorMapBuilder = new ErrorMapBuilder({
                globalProperty: 'message',
                rollbackError: defaultError,
            });

            mockErrorMapBuilder.equals('Test error').throwString('TEST_ERROR');

            errorTransformer = new ErrorTransformer({
                errorMap: mockErrorMapBuilder,
                moduleName: 'test_module',
            });
        });

        it('should handle error without message property', () => {
            const error = { name: 'Error', stack: 'stack trace' };

            expect(() => {
                errorTransformer.transform(error, {
                    layer: ErrorLayerEnum.APP,
                    className: 'TestClass',
                    methodName: 'testMethod',
                });
            }).toThrow(InternalError);
        });

        it('should handle null error', () => {
            expect(() => {
                errorTransformer.transform(null, {
                    layer: ErrorLayerEnum.APP,
                    className: 'TestClass',
                    methodName: 'testMethod',
                });
            }).toThrow(InternalError);
        });

        it('should handle undefined error', () => {
            expect(() => {
                errorTransformer.transform(undefined, {
                    layer: ErrorLayerEnum.APP,
                    className: 'TestClass',
                    methodName: 'testMethod',
                });
            }).toThrow(InternalError);
        });

        it('should handle string error', () => {
            expect(() => {
                errorTransformer.transform('String error', {
                    layer: ErrorLayerEnum.APP,
                    className: 'TestClass',
                    methodName: 'testMethod',
                });
            }).toThrow(InternalError);
        });

        it('should handle empty error map', () => {
            const emptyBuilder = new ErrorMapBuilder({
                globalProperty: 'message',
                rollbackError: defaultError,
            });
            const emptyTransformer = new ErrorTransformer({
                errorMap: emptyBuilder,
                moduleName: 'test_module',
            });
            const error = new Error('Any error');

            expect(() => {
                emptyTransformer.transform(error, {
                    layer: ErrorLayerEnum.APP,
                    className: 'TestClass',
                    methodName: 'testMethod',
                });
            }).toThrow(InternalError);
        });
    });

    describe('Complex Error Scenarios', () => {
        beforeEach(() => {
            const externalServiceError = new ExternalServiceError({
                code: 'KEYCLOAK_ERROR',
                message: 'Keycloak service error',
                externalService: 'Keycloak',
            });

            mockErrorMapBuilder = new ErrorMapBuilder({
                globalProperty: 'message',
                rollbackError: defaultError,
            });

            mockErrorMapBuilder
                .includes(['Keycloak', 'connection'])
                .throwErrorInstance(externalServiceError)
                .matches(/^HTTP \d{3}:/)
                .throwString('HTTP_ERROR');

            errorTransformer = new ErrorTransformer({
                errorMap: mockErrorMapBuilder,
                moduleName: 'test_module',
            });
        });

        it('should handle HTTP error pattern matching', () => {
            const error = new Error('HTTP 404: Not Found');

            expect(() => {
                errorTransformer.transform(error, {
                    layer: ErrorLayerEnum.APP,
                    className: 'TestClass',
                    methodName: 'testMethod',
                });
            }).toThrow('HTTP_ERROR');
        });
    });
});
