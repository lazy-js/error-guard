export declare function removeWorkingDirectoryFromStack(stack: string): string;
export declare function cleanStack(stack: string, ...linesToExclude: string[]): string;
export declare function generateStack({ clean, removeWorkingDirectoryPrefix, errorName, }: {
    clean?: string[];
    removeWorkingDirectoryPrefix?: boolean;
    errorName?: string;
}): string | undefined;
//# sourceMappingURL=index.d.ts.map