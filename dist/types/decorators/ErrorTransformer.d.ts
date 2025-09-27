import { ErrorContextBase } from '../types/errors';
export declare function AsyncTransform(context?: Partial<ErrorContextBase>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function SyncTransform(context?: Partial<ErrorContextBase>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function AutoTransform(options?: {
    exclude?: string[];
    asyncOnly?: boolean;
    defaultContext?: Partial<ErrorContextBase>;
}): <T extends {
    new (...args: any[]): any;
}>(constructor: T) => {
    new (...args: any[]): {
        [x: string]: any;
        applyAutoTransform(opts?: typeof options): void;
    };
} & T;
//# sourceMappingURL=ErrorTransformer.d.ts.map