import { describe, it, expect, beforeAll } from 'vitest';
import { ErrorTransformer } from '../';
import { ValidationError } from '../';
import { AutoTransform } from '../';
import { errorMessage, testErrorTransformer } from './setup';

describe('ErrorTransformer using class decorator', () => {
    let testClass: any;
    beforeAll(() => {
        @AutoTransform()
        class TestClass {
            public name: string;
            constructor(public errorTransformer: ErrorTransformer) {
                this.name = 'TestClass';
            }

            async rejectAsync(): Promise<string> {
                throw new Error(errorMessage);
            }

            async resolveAsync(): Promise<string> {
                return await Promise.resolve(this.name);
            }

            rejectSync(): string {
                throw new Error(errorMessage);
            }
            resolveSync(): string {
                return this.name;
            }
        }
        testClass = new TestClass(testErrorTransformer);
    });

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
