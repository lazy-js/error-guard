import { ErrorContextBase } from './errors';

type ErrorMapCondition =
    | 'includes'
    | 'startsWith'
    | 'endsWith'
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'notContains'
    | 'matches'
    | 'notMatches'
    | 'instanceOf'
    | 'enum';

type _ErrorMapBase = {
    condition: ErrorMapCondition;
    propertyName?: string;
};

interface ErrorMapIncludes extends _ErrorMapBase {
    condition: 'includes';
    messageParts: string[];
}

interface ErrorMapEnum extends _ErrorMapBase {
    condition: 'enum';
    enum: string[];
}
interface ErrorMapMatches extends _ErrorMapBase {
    condition: 'matches';
    messageRegex: RegExp;
}

interface ErrorMapEquals extends _ErrorMapBase {
    condition: 'equals';
    message: string;
}

export type Constructor<T = {}> = new (...args: any[]) => T;

interface ErrorMapInstanceOf extends _ErrorMapBase {
    condition: 'instanceOf';
    error: Constructor;
}

interface _ErrorMapOutBase {
    type: 'ThrowErrorInstance' | 'ThrowString' | 'ThrowOriginalError' | 'ThrowCustomError';
}

export interface ErrorMapIfOutErrorInstance<T, C> extends _ErrorMapOutBase {
    type: 'ThrowErrorInstance';
    error: T;
}

interface ErrorMapIfOutString extends _ErrorMapOutBase {
    type: 'ThrowString';
    string: string;
}

interface ErrorMapIfOutPass extends _ErrorMapOutBase {
    type: 'ThrowOriginalError';
}

interface ErrorMapIfOutCustomError extends _ErrorMapOutBase {
    type: 'ThrowCustomError';
    handler: (err: any, context: ErrorContextBase) => Error;
}

export type ErrorMapInputBase = ErrorMapIncludes | ErrorMapMatches | ErrorMapEquals | ErrorMapInstanceOf | ErrorMapEnum;

export type ErrorMapOutBase<T, C> =
    // short hand for pass
    | 'ThrowOriginalError'
    | ErrorMapIfOutPass
    | ErrorMapIfOutErrorInstance<T, C>
    | ErrorMapIfOutString
    | ErrorMapIfOutCustomError;

/**
 * @description ErrorMap is a type that represents a mapping of an input to an output
 * @description T is enum of error constructors
 * @description C is the type of the constructor
 */
export type ErrorMapBase<T, C> = {
    input: ErrorMapInputBase;
    output: ErrorMapOutBase<T, C>;
};
