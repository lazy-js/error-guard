import { Console } from './Console';
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
class StackHelper {
    static createStack(errorName: string, errorMessage: string): string {
        const errorStack = new Error(errorMessage).stack || '';
        return errorStack.replace('Error: ', `${errorName}: `);
    }

    static getCallStack(_stack: string | Error): CallStack[] {
        const stack = _stack instanceof Error ? _stack.stack || '' : _stack || new Error().stack || '';

        if (!stack) return [];

        // Use more efficient string operations
        const lines = stack.split('\n');
        if (lines.length <= 1) return [];

        // Skip first line (error message) and filter in one pass
        const filteredLines = lines
            .slice(1)
            .filter((line) => line.trim() && !line.includes('at getCallStack') && !line.includes('createStack'));

        // Pre-allocate array for better performance
        const callStack: CallStack[] = new Array(filteredLines.length);

        for (let i = 0; i < filteredLines.length; i++) {
            const line = filteredLines[i];
            const trimmedLine = line.trim();

            // More efficient parsing
            const atIndex = trimmedLine.indexOf('at ');
            if (atIndex === -1) continue;

            const afterAt = trimmedLine.substring(atIndex + 3);
            const parenIndex = afterAt.indexOf('(');

            let functionName: string;
            let fullFileRef: string;

            if (parenIndex === -1) {
                functionName = 'anonymous';
                fullFileRef = afterAt;
            } else {
                functionName = afterAt.substring(0, parenIndex).trim();
                fullFileRef = afterAt.substring(parenIndex + 1, afterAt.lastIndexOf(')'));
            }

            const { filePath, lineNumber, columnNumber } = StackHelper._parseFullFileRef(fullFileRef);

            callStack[i] = {
                functionName,
                filePath,
                lineNumber,
                columnNumber,
                fullFileRef,
            };
        }

        return callStack;
    }

    static _parseFullFileRef(fullFileRef: string): {
        filePath: string;
        lineNumber: string;
        columnNumber: string;
    } {
        const [driveLetter, filePath, lineNumber, columnNumber] = fullFileRef.replace(')', '').trim().split(':');
        return {
            filePath: driveLetter + ':' + filePath,
            lineNumber,
            columnNumber,
        };
    }
    static getAndFilterCallStack(_stack: string | Error, keywords: string[]): CallStack[] {
        return StackHelper.getCallStack(_stack).filter(
            (callSite) => !keywords.some((keyword) => callSite.fullFileRef.includes(keyword))
        );
    }

    static _formatFunctionName(functionName: string): string {
        if (functionName === 'anonymous') {
            return functionName;
        }
        if (functionName.includes('.')) {
            return functionName.replace('.', ' #');
        }
        return functionName;
    }
    static formatCallStackLine(callSite: CallStack, index: number = 0): string {
        const isCurrentFrame = index === 0;
        const frameColor = Console.fgColors.muted;
        const lineColor = Console.fgColors.white;
        const functionColor = Console.fgColors.white;
        const frameIndicator = isCurrentFrame ? '|\n|--> inside' : `|--> parent ${index}`;

        const functionName = StackHelper._formatFunctionName(callSite.functionName);
        return (
            `${frameColor}${frameIndicator} ${callSite.fullFileRef}${Console.styles.reset} #${functionName}${Console.styles.reset}\n` +
            `|--- ${lineColor} Line:${Console.styles.reset} ${Console.styles.dim}${callSite.lineNumber}${Console.styles.reset}` +
            `${functionColor} Function:${Console.styles.reset} ${Console.styles.dim}${functionName}()${Console.styles.reset}` +
            '\n|'
        );
    }

    static concatErrorStacks(_source: string | Error, _target: string | Error): string {
        const source = StackHelper.getCallStack(_source);
        const target = StackHelper.getCallStack(_target);
        return source.concat(target).join('\n');
    }

    static logCallStack(callStack: CallStack[]): void {
        callStack.forEach((callSite, index) => {
            console.log(`${StackHelper.formatCallStackLine(callSite, index)}`);
        });
    }

    static logStack(_stack: string | Error): void {
        const callStack = StackHelper.getCallStack(_stack);
        StackHelper.logCallStack(callStack);
    }
    static logErrorName(errorName: string, errorMessage: string): void {
        console.log(
            `${Console.bgColors.error}${Console.fgColors.white} ${errorName} ${Console.styles.reset}: ${errorMessage}`
        );
    }

    static logFunctionsStack(callStack: CallStack[]): void {
        const names = callStack.map((callSite) => callSite.functionName);
        console.log(names.reverse().join(' --> '));
    }

    static singleLineSeparator(text: string = '', color: string = Console.fgColors.warning): void {
        console.log(color + `-----------------${text}-----------------` + Console.styles.reset);
    }

    static doubleLineSeparator(text: string = '', color: string = Console.fgColors.warning): void {
        console.log(color + `================${text}================` + Console.styles.reset);
    }
}

export { StackHelper };
