"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppResponseError = void 0;
class AppResponseError extends Error {
    constructor(params) {
        super(params.code);
        this.code = params.code;
    }
}
exports.AppResponseError = AppResponseError;
//# sourceMappingURL=AppResponseError.js.map