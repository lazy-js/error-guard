import crypto from 'crypto';
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
TraceId.TRACE_ID_HEADER = 'x-trace-id';
TraceId.TRACE_ID_LENGTH = 32;
function generateTraceId(length) {
    const hex = crypto.randomBytes(length / 2).toString('hex');
    return hex;
}
export { TraceId };
//# sourceMappingURL=TraceId.js.map