export type Colors = 'white' | 'black' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'muted' | 'accent';
export declare const bgColors: Record<Colors, string>;
export declare const fgColors: Record<Colors, string>;
type Styles = 'reset' | 'bright' | 'dim' | 'italic' | 'underline' | 'strikethrough';
export declare const styles: Record<Styles, string>;
interface ConsoleOptions {
    fgColor?: Colors;
    bgColor?: Colors;
    style?: Styles;
}
export declare class Console {
    static bgColors: Record<Colors, string>;
    static fgColors: Record<Colors, string>;
    static styles: Record<Styles, string>;
    private static colorCache;
    static log(message: string, { fgColor, bgColor, style }?: ConsoleOptions): void;
    static error(message: string): void;
    static warning(message: string): void;
    static info(message: string): void;
    static success(message: string): void;
    static primary(message: string): void;
    static secondary(message: string): void;
    static muted(message: string): void;
    static accent(message: string): void;
}
export default Console;
//# sourceMappingURL=Console.d.ts.map