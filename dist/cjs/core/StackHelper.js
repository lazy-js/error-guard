"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHelper = void 0;
const Console_1 = require("./Console");
/**
 * StackHelper class
 * This class is used to get and filter the call stack
 *
 */
class StackHelper {
    static createStack(errorName, errorMessage) {
        const errorStack = new Error(errorMessage).stack || '';
        return errorStack.replace('Error: ', `${errorName}: `);
    }
    static getCallStack(_stack) {
        const stack = _stack instanceof Error ? _stack.stack || '' : _stack || new Error().stack || '';
        if (!stack)
            return [];
        // Use more efficient string operations
        const lines = stack.split('\n');
        if (lines.length <= 1)
            return [];
        // Skip first line (error message) and filter in one pass
        const filteredLines = lines
            .slice(1)
            .filter((line) => line.trim() && !line.includes('at getCallStack') && !line.includes('createStack'));
        // Pre-allocate array for better performance
        const callStack = new Array(filteredLines.length);
        for (let i = 0; i < filteredLines.length; i++) {
            const line = filteredLines[i];
            const trimmedLine = line.trim();
            // More efficient parsing
            const atIndex = trimmedLine.indexOf('at ');
            if (atIndex === -1)
                continue;
            const afterAt = trimmedLine.substring(atIndex + 3);
            const parenIndex = afterAt.indexOf('(');
            let functionName;
            let fullFileRef;
            if (parenIndex === -1) {
                functionName = 'anonymous';
                fullFileRef = afterAt;
            }
            else {
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
    static _parseFullFileRef(fullFileRef) {
        const [driveLetter, filePath, lineNumber, columnNumber] = fullFileRef.replace(')', '').trim().split(':');
        return {
            filePath: driveLetter + ':' + filePath,
            lineNumber,
            columnNumber,
        };
    }
    static getAndFilterCallStack(_stack, keywords) {
        return StackHelper.getCallStack(_stack).filter((callSite) => !keywords.some((keyword) => callSite.fullFileRef.includes(keyword)));
    }
    static _formatFunctionName(functionName) {
        if (functionName === 'anonymous') {
            return functionName;
        }
        if (functionName.includes('.')) {
            return functionName.replace('.', ' #');
        }
        return functionName;
    }
    static formatCallStackLine(callSite, index = 0) {
        const isCurrentFrame = index === 0;
        const frameColor = Console_1.Console.fgColors.muted;
        const lineColor = Console_1.Console.fgColors.white;
        const functionColor = Console_1.Console.fgColors.white;
        const frameIndicator = isCurrentFrame ? '|\n|--> inside' : `|--> parent ${index}`;
        const functionName = StackHelper._formatFunctionName(callSite.functionName);
        return (`${frameColor}${frameIndicator} ${callSite.fullFileRef}${Console_1.Console.styles.reset} #${functionName}${Console_1.Console.styles.reset}\n` +
            `|--- ${lineColor} Line:${Console_1.Console.styles.reset} ${Console_1.Console.styles.dim}${callSite.lineNumber}${Console_1.Console.styles.reset}` +
            `${functionColor} Function:${Console_1.Console.styles.reset} ${Console_1.Console.styles.dim}${functionName}()${Console_1.Console.styles.reset}` +
            '\n|');
    }
    static concatErrorStacks(_source, _target) {
        const source = StackHelper.getCallStack(_source);
        const target = StackHelper.getCallStack(_target);
        return source.concat(target).join('\n');
    }
    static logCallStack(callStack) {
        callStack.forEach((callSite, index) => {
            console.log(`${StackHelper.formatCallStackLine(callSite, index)}`);
        });
    }
    static logStack(_stack) {
        const callStack = StackHelper.getCallStack(_stack);
        StackHelper.logCallStack(callStack);
    }
    static logErrorName(errorName, errorMessage) {
        console.log(`${Console_1.Console.bgColors.error}${Console_1.Console.fgColors.white} ${errorName} ${Console_1.Console.styles.reset}: ${errorMessage}`);
    }
    static logFunctionsStack(callStack) {
        const names = callStack.map((callSite) => callSite.functionName);
        console.log(names.reverse().join(' --> '));
    }
    static singleLineSeparator(text = '', color = Console_1.Console.fgColors.warning) {
        console.log(color + `-----------------${text}-----------------` + Console_1.Console.styles.reset);
    }
    static doubleLineSeparator(text = '', color = Console_1.Console.fgColors.warning) {
        console.log(color + `================${text}================` + Console_1.Console.styles.reset);
    }
}
exports.StackHelper = StackHelper;
//# sourceMappingURL=StackHelper.js.map