import { Constructor, ErrorContextBase } from '../types';
import { ErrorInstance } from './Error';
import { ErrorMap } from './ErrorTransformer';
interface ErrorMapBuilderOptions {
    globalProperty: string;
    rollbackError: ErrorInstance;
}
interface InputOptions {
    propertyName?: string;
}
type CustomErrorHandler = (err: any, ctx: ErrorContextBase) => Error;
interface OutputMethods {
    throwErrorInstance: (errorInstance: ErrorInstance) => ErrorMapBuilder;
    throwString: (string: string) => ErrorMapBuilder;
    throwCustomError: (handler: CustomErrorHandler) => ErrorMapBuilder;
    pass: () => ErrorMapBuilder;
}
export declare class ErrorMapBuilder {
    errorMapList: ErrorMap[];
    private currentErrorMap;
    globalProperty: string;
    rollbackError: ErrorInstance;
    constructor(options: ErrorMapBuilderOptions);
    equals(value: string, options?: InputOptions): OutputMethods;
    oneOf(enums: string[], options?: InputOptions): OutputMethods;
    matches(messageRegex: RegExp, options?: InputOptions): OutputMethods;
    includes(messageParts: string[], options?: InputOptions): OutputMethods;
    instanceOf(constructor: Constructor): OutputMethods;
    private assignOutputMethods;
    private throwErrorInstance;
    private throwString;
    private pass;
    private throwCustomError;
    private pushCurrentAndClear;
    checkIfInputExists(): void;
}
export {};
//# sourceMappingURL=ErrorMapBuilder.d.ts.map