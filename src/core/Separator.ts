import { Console, Colors } from './Console';
interface SeparatorOptions {
    length?: number;
    color?: Colors;
}
class Separator {
    static singleLine(text: string, option?: SeparatorOptions): void {
        let { length, color } = option ?? {};
        if (!length) {
            length = 10;
        }
        if (!color) {
            color = 'muted';
        }
        console.log(
            Console.fgColors[color] +
                '-'.repeat(length) +
                text +
                '-'.repeat(length) +
                Console.styles.reset,
        );
    }
    static doubleLine(text: string, option?: SeparatorOptions): void {
        let { length, color } = option ?? {};
        if (!length) {
            length = 10;
        }
        if (!color) {
            color = 'muted';
        }
        console.log(
            Console.fgColors[color] +
                '='.repeat(length) +
                text +
                '='.repeat(length) +
                Console.styles.reset,
        );
    }
}

export { Separator };
