import { Colors } from './Console';
interface SeperatorOptions {
    length?: number;
    color?: Colors;
}
declare class Seperator {
    static singleLine(text: string, option?: SeperatorOptions): void;
    static doubleLine(text: string, option?: SeperatorOptions): void;
}
export { Seperator };
//# sourceMappingURL=Seperator.d.ts.map