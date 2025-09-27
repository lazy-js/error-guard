declare class TraceId {
    private static TRACE_ID_HEADER;
    private static TRACE_ID_LENGTH;
    private traceId;
    private constructor();
    getTraceId(): string;
    static setupTraceIdMiddleware(req: any, _res: any, next: any): void;
    static validateTraceId(traceId: string): string;
    static setTraceIdHeaderName(traceId: string): void;
    static setTraceIdHeaderLength(traceId: number): void;
}
export { TraceId };
//# sourceMappingURL=TraceId.d.ts.map