// Fixed background colors with better contrast
export const bgColors = {
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
export const fgColors = {
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
export const styles = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    strikethrough: '\x1b[9m',
};
export class Console {
    static log(message, { fgColor, bgColor, style } = {
        fgColor: 'black',
        bgColor: 'white',
        style: 'reset',
    }) {
        const cacheKey = `${fgColor}-${bgColor}-${style}`;
        let colorString = this.colorCache.get(cacheKey);
        if (!colorString) {
            colorString = bgColors[bgColor !== null && bgColor !== void 0 ? bgColor : 'white'] + fgColors[fgColor !== null && fgColor !== void 0 ? fgColor : 'black'] + styles[style !== null && style !== void 0 ? style : 'reset'];
            this.colorCache.set(cacheKey, colorString);
        }
        console.log(colorString + message + styles.reset);
    }
    static error(message) {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'error',
            style: 'reset',
        });
    }
    static warning(message) {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'warning',
            style: 'reset',
        });
    }
    static info(message) {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'info',
            style: 'reset',
        });
    }
    static success(message) {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'success',
            style: 'reset',
        });
    }
    static primary(message) {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'primary',
            style: 'reset',
        });
    }
    static secondary(message) {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'secondary',
            style: 'reset',
        });
    }
    static muted(message) {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'muted',
            style: 'reset',
        });
    }
    static accent(message) {
        Console.log(message, {
            fgColor: 'white',
            bgColor: 'accent',
            style: 'reset',
        });
    }
}
Console.bgColors = bgColors;
Console.fgColors = fgColors;
Console.styles = styles;
// Cache for frequently used color combinations
Console.colorCache = new Map();
export default Console;
//# sourceMappingURL=Console.js.map