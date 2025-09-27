import { Colors } from './Console';
interface SeparatorOptions {
    length?: number;
    color?: Colors;
}
declare class Separator {
    static singleLine(text: string, option?: SeparatorOptions): void;
    static doubleLine(text: string, option?: SeparatorOptions): void;
}
export { Separator };
//# sourceMappingURL=Separator.d.ts.map