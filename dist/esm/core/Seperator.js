import { Console } from './Console';
class Seperator {
    static singleLine(text, option) {
        let { length, color } = option !== null && option !== void 0 ? option : {};
        if (!length) {
            length = 10;
        }
        if (!color) {
            color = 'muted';
        }
        console.log(Console.fgColors[color] +
            '-'.repeat(length) +
            text +
            '-'.repeat(length) +
            Console.styles.reset);
    }
    static doubleLine(text, option) {
        let { length, color } = option !== null && option !== void 0 ? option : {};
        if (!length) {
            length = 10;
        }
        if (!color) {
            color = 'muted';
        }
        console.log(Console.fgColors[color] +
            '='.repeat(length) +
            text +
            '='.repeat(length) +
            Console.styles.reset);
    }
}
export { Seperator };
//# sourceMappingURL=Seperator.js.map