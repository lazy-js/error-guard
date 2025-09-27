export type Colors =
    | 'white'
    | 'black'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'muted'
    | 'accent';

// Fixed background colors with better contrast
export const bgColors: Record<Colors, string> = {
    white: '\x1b[47m', // Standard white background
    black: '\x1b[40m', // Standard black background
    primary: '\x1b[44m', // Blue background
    secondary: '\x1b[45m', // Magenta background
    success: '\x1b[42m', // Green background
    warning: '\x1b[43m', // Yellow background
    error: '\x1b[41m', // Red background
    info: '\x1b[46m', // Cyan background
    muted: '\x1b[100m', // Dark gray background
    accent: '\x1b[48;5;208m', // Orange background (256-color)
};

// Fixed foreground colors with better readability
export const fgColors: Record<Colors, string> = {
    white: '\x1b[97m', // Bright white
    black: '\x1b[30m', // Black
    primary: '\x1b[34m', // Blue
    secondary: '\x1b[35m', // Magenta
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    info: '\x1b[36m', // Cyan
    muted: '\x1b[90m', // Dark gray
    accent: '\x1b[38;5;208m', // Orange (256-color)
};

type Styles = 'reset' | 'bright' | 'dim' | 'italic' | 'underline' | 'strikethrough';
export const styles: Record<Styles, string> = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    strikethrough: '\x1b[9m',
};

interface ConsoleOptions {
    fgColor?: Colors;
    bgColor?: Colors;
    style?: Styles;
}
export class Console {
    static bgColors = bgColors;
    static fgColors = fgColors;
    static styles = styles;

    // Cache for frequently used color combinations
    private static colorCache = new Map<string, string>();

    static log(
        message: string,
        { fgColor, bgColor, style }: ConsoleOptions = {
            fgColor: 'black',
            bgColor: 'white',
            style: 'reset',
        }
    ): void {
        const cacheKey = `${fgColor}-${bgColor}-${style}`;
        let colorString = this.colorCache.get(cacheKey);

        if (!colorString) {
            colorString = bgColors[bgColor ?? 'white'] + fgColors[fgColor ?? 'black'] + styles[style ?? 'reset'];
            this.colorCache.set(cacheKey, colorString);
        }

        console.log(colorString + message + styles.reset);
    }

    static error(message: string): void {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'error',
            style: 'reset',
        });
    }

    static warning(message: string): void {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'warning',
            style: 'reset',
        });
    }

    static info(message: string): void {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'info',
            style: 'reset',
        });
    }

    static success(message: string): void {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'success',
            style: 'reset',
        });
    }

    static primary(message: string): void {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'primary',
            style: 'reset',
        });
    }

    static secondary(message: string): void {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'secondary',
            style: 'reset',
        });
    }

    static muted(message: string): void {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'muted',
            style: 'reset',
        });
    }

    static accent(message: string): void {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'accent',
            style: 'reset',
        });
    }
}

export default Console;
