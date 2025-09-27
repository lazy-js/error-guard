import { Request, Response, NextFunction } from 'express';
import { ErrorContextBase } from './errors';
interface Logger {
    error(...args: any[]): void;
    warn(...args: any[]): void;
}
/**
 * Express-specific error context that extends the base error context
 * with Express request metadata
 */
export interface ExpressErrorContext extends ErrorContextBase {
    method?: string;
    url?: string;
    path?: string;
    query?: Record<string, any>;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    userAgent?: string;
    ip?: string;
    route?: string;
    originalUrl?: string;
    baseUrl?: string;
    body?: Record<string, any>;
}
/**
 * Standardized error response format for Express applications
 */
export interface ExpressErrorResponse {
    code: string;
    serviceName: string;
    message: string;
    timestamp: string;
    traceId: string;
    statusCode: number;
}
/**
 * Express error handler function signature
 */
export type ExpressErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => void;
/**
 * Express error handler options
 */
export interface ExpressErrorHandlerOptions {
    /**
     * Service name to include in error responses
     * Defaults to process.env.SERVICE_NAME or 'unknown'
     */
    serviceName?: string;
    /**
     * Header name to extract trace ID from
     * Defaults to 'x-trace-id'
     */
    traceIdHeader?: string;
    /**
     * Whether to include request body in error context
     * Defaults to false for security
     */
    includeRequestBody?: boolean;
    /**
     * Maximum size of request body to include (in bytes)
     * Defaults to 1024
     */
    maxBodySize?: number;
    /**
     * Whether to log errors using the existing Console utility
     * Defaults to true
     */
    enableLogging?: boolean;
    /**
     * Custom logger injection
     */
    logger?: Logger;
}
/**
 * Express request metadata extraction utility
 */
export interface RequestMetadata {
    method: string;
    url: string;
    path: string;
    query: Record<string, any>;
    params: Record<string, any>;
    headers: Record<string, string>;
    userAgent: string;
    ip: string;
    route?: string;
    originalUrl: string;
    baseUrl: string;
    body?: Record<string, any>;
}
export {};
//# sourceMappingURL=express.d.ts.map