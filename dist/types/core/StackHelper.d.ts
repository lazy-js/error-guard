interface CallStack {
    functionName: string;
    filePath: string;
    lineNumber: string;
    columnNumber: string;
    fullFileRef: string;
}
/**
 * StackHelper class
 * This class is used to get and filter the call stack
 *
 */
declare class StackHelper {
    static createStack(errorName: string, errorMessage: string): string;
    static getCallStack(_stack: string | Error): CallStack[];
    static _parseFullFileRef(fullFileRef: string): {
        filePath: string;
        lineNumber: string;
        columnNumber: string;
    };
    static getAndFilterCallStack(_stack: string | Error, keywords: string[]): CallStack[];
    static _formatFunctionName(functionName: string): string;
    static formatCallStackLine(callSite: CallStack, index?: number): string;
    static concatErrorStacks(_source: string | Error, _target: string | Error): string;
    static logCallStack(callStack: CallStack[]): void;
    static logStack(_stack: string | Error): void;
    static logErrorName(errorName: string, errorMessage: string): void;
    static logFunctionsStack(callStack: CallStack[]): void;
    static singleLineSeparator(text?: string, color?: string): void;
    static doubleLineSeparator(text?: string, color?: string): void;
}
export { StackHelper };
//# sourceMappingURL=StackHelper.d.ts.map