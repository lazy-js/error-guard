"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seperator = void 0;
const Console_1 = require("./Console");
class Seperator {
    static singleLine(text, option) {
        let { length, color } = option !== null && option !== void 0 ? option : {};
        if (!length) {
            length = 10;
        }
        if (!color) {
            color = 'muted';
        }
        console.log(Console_1.Console.fgColors[color] +
            '-'.repeat(length) +
            text +
            '-'.repeat(length) +
            Console_1.Console.styles.reset);
    }
    static doubleLine(text, option) {
        let { length, color } = option !== null && option !== void 0 ? option : {};
        if (!length) {
            length = 10;
        }
        if (!color) {
            color = 'muted';
        }
        console.log(Console_1.Console.fgColors[color] +
            '='.repeat(length) +
            text +
            '='.repeat(length) +
            Console_1.Console.styles.reset);
    }
}
exports.Seperator = Seperator;
//# sourceMappingURL=Seperator.js.map