"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeWorkingDirectoryFromStack = removeWorkingDirectoryFromStack;
exports.cleanStack = cleanStack;
exports.generateStack = generateStack;
function removeWorkingDirectoryFromStack(stack) {
    return stack.replace(process.cwd(), '');
}
function cleanStack(stack, ...linesToExclude) {
    return stack
        .split('\n')
        .filter((line) => !linesToExclude.some((lineToExclude) => line.includes(lineToExclude)))
        .join('\n');
}
function generateStack({ clean, removeWorkingDirectoryPrefix, errorName, }) {
    let stack = undefined;
    const error = new Error();
    // replace the stack string which starts with "Error" with the error name
    stack = error.stack;
    if (errorName) {
        stack = stack === null || stack === void 0 ? void 0 : stack.replace(/^Error: \n /, `${errorName}: \n `);
    }
    if (removeWorkingDirectoryPrefix) {
        stack = removeWorkingDirectoryFromStack(stack !== null && stack !== void 0 ? stack : '');
    }
    return clean && clean.length > 0
        ? cleanStack(stack !== null && stack !== void 0 ? stack : '', ...clean)
        : stack;
}
//# sourceMappingURL=index.js.map