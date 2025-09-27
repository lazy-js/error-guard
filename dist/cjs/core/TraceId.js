"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceId = void 0;
const crypto_1 = __importDefault(require("crypto"));
class TraceId {
    constructor() {
        this.traceId = generateTraceId(TraceId.TRACE_ID_LENGTH);
    }
    getTraceId() {
        return this.traceId;
    }
    static setupTraceIdMiddleware(req, _res, next) {
        try {
            const traceId = generateTraceId(TraceId.TRACE_ID_LENGTH);
            if (!req.headers[TraceId.TRACE_ID_HEADER]) {
                req.headers[TraceId.TRACE_ID_HEADER] = traceId;
            }
            else {
                TraceId.validateTraceId(req.headers[TraceId.TRACE_ID_HEADER]);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    }
    static validateTraceId(traceId) {
        if (traceId.length !== TraceId.TRACE_ID_LENGTH) {
            throw new Error('Trace ID is invalid');
        }
        return traceId;
    }
    static setTraceIdHeaderName(traceId) {
        TraceId.TRACE_ID_HEADER = traceId;
    }
    static setTraceIdHeaderLength(traceId) {
        if (traceId % 2 !== 0) {
            throw new Error('Trace ID length must be even');
        }
        TraceId.TRACE_ID_LENGTH = traceId;
    }
}
exports.TraceId = TraceId;
TraceId.TRACE_ID_HEADER = 'x-trace-id';
TraceId.TRACE_ID_LENGTH = 32;
function generateTraceId(length) {
    const hex = crypto_1.default.randomBytes(length / 2).toString('hex');
    return hex;
}
//# sourceMappingURL=TraceId.js.map