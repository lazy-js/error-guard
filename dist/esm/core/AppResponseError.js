export class AppResponseError extends Error {
    constructor(params) {
        super(params.code);
        this.code = params.code;
    }
}
//# sourceMappingURL=AppResponseError.js.map