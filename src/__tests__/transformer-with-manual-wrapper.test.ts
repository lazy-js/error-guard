import { describe, it, expect } from 'vitest';
import { ErrorTransformer } from '../';
import { ValidationError } from '../';
import { errorMessage, testErrorTransformer } from './setup';

class TestClass {
    public name: string;
    public errorTransformer: ErrorTransformer;
    constructor(errorTransformer: ErrorTransformer) {
        this.errorTransformer = errorTransformer;
        this.name = 'TestClass';
    }

    async rejectAsync(): Promise<string> {
        return this.errorTransformer.withAsyncTransform(
            async (): Promise<string> => {
                throw new Error(errorMessage);
            },
            { methodName: 'rejectAsync' },
        )();
    }

    async resolveAsync(): Promise<string> {
        return this.errorTransformer.withAsyncTransform(
            async (): Promise<string> => {
                return await Promise.resolve(this.name);
            },
            { methodName: 'resolveAsync' },
        )();
    }

    rejectSync(): string {
        return this.errorTransformer.withSyncTransform(
            (): string => {
                throw new Error(errorMessage);
            },
            { methodName: 'rejectSync' },
        )();
    }

    resolveSync(): string {
        return this.errorTransformer.withSyncTransform(
            (): string => {
                return this.name;
            },
            { methodName: 'resolveSync' },
        )();
    }
}

const testClass = new TestClass(testErrorTransformer);

describe('ErrorTransformer using manual wrapper', () => {
    it('should transform async function errors', async () => {
        try {
            await testClass.rejectAsync();
        } catch (error: any) {
            expect(error).toBeInstanceOf(ValidationError);
        }
    });

    it('should resolve async function when no error', async () => {
        const name = await testClass.resolveAsync();
        expect(name).toBe(testClass.name);
    });

    it('should transform sync function errors', () => {
        try {
            testClass.rejectSync();
        } catch (error: any) {
            expect(error).toBeInstanceOf(ValidationError);
        }
    });

    it('should resolve sync function when no error', () => {
        const name = testClass.resolveSync();
        expect(name).toBe(testClass.name);
    });
});
