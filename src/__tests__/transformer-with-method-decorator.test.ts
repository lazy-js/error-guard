import { describe, it, expect } from 'vitest';
import { ErrorTransformer } from '../';
import { ValidationError } from '../';
import { AsyncTransform, SyncTransform } from '../';
import { errorMessage, testErrorTransformer } from './setup';

class TestClass {
    public name: string;
    constructor(public errorTransformer: ErrorTransformer) {
        this.name = 'TestClass';
    }

    // @ts-ignore
    @AsyncTransform()
    async rejectAsync(): Promise<string> {
        throw new Error(errorMessage);
    }

    // @ts-ignore
    @AsyncTransform()
    async resolveAsync(): Promise<string> {
        return Promise.resolve(this.name);
    }

    // @ts-ignore
    @SyncTransform()
    rejectSync(): string {
        throw new Error(errorMessage);
    }

    // @ts-ignore
    @SyncTransform()
    resolveSync(): string {
        return this.name;
    }
}
const testClass = new TestClass(testErrorTransformer);

describe('ErrorTransformer using method decorator', () => {
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
