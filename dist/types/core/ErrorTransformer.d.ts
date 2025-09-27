import { ErrorConstructorEnum, ErrorConstructorType } from '../enums';
import { ErrorInstance } from './Error';
import { ErrorMapBase, ErrorMapOutBase, ErrorMapInputBase } from '../types/transformer';
import { ErrorContextBase } from '../types/errors';
import { ErrorMapBuilder } from './ErrorMapBuilder';
export type ErrorMap = ErrorMapBase<ErrorInstance, ErrorConstructorEnum | ErrorConstructorType>;
export type ErrorMapOut = ErrorMapOutBase<ErrorInstance, ErrorConstructorEnum | ErrorConstructorType>;
export type ErrorMapInput = ErrorMapInputBase;
export type ErrorTransformerLogLevels = 'unknown' | 'known' | 'all' | 'never';
export type ErrorInput = Error | string | null | undefined | Record<string, unknown>;
interface ErrorTransformerOptions {
    log?: ErrorTransformerLogLevels;
}
interface ErrorTranformerConfig {
    errorMap: ErrorMapBuilder;
    moduleName?: string;
}
export declare class ErrorTransformer {
    options?: ErrorTransformerOptions | undefined;
    private errorMap;
    private defaultError;
    private globalProperty;
    private log;
    private moduleName;
    constructor(config: ErrorTranformerConfig, options?: ErrorTransformerOptions | undefined);
    transform(err: ErrorInput, patchedContext: ErrorContextBase): never;
    withAsyncTransform<TArgs extends readonly unknown[], TReturn>(wrappedMethod: (...args: TArgs) => Promise<TReturn>, patchedContext: ErrorContextBase): (...args: TArgs) => Promise<TReturn>;
    withSyncTransform<TArgs extends readonly unknown[], TReturn>(wrappedMethod: (...args: TArgs) => TReturn, patchedContext: ErrorContextBase): (...args: TArgs) => TReturn;
    private normalizeError;
    private getPropertyValue;
    private msgIncludes;
    private msgMatches;
    private msgEquals;
    private errorInstanceOf;
    private errorEnum;
    private handleInput;
    private handleThrowOriginalErrorOutput;
    private handleThrowErrorInstanceOutput;
    private handleOutput;
}
export {};
//# sourceMappingURL=ErrorTransformer.d.ts.map