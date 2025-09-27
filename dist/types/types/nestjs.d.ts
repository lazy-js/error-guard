import { ArgumentsHost } from '@nestjs/common';
import { ErrorContextBase } from './errors';
interface Logger {
    error(...args: any[]): void;
    warn(...args: any[]): void;
}
/**
 * NestJS-specific error context that extends the base error context
 * with NestJS request metadata
 */
export interface NestJSErrorContext extends ErrorContextBase {
    method?: string;
    url?: string;
    path?: string;
    query?: Record<string, any>;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    userAgent?: string;
    ip?: string;
    controllerName?: string;
    handlerName?: string;
    route?: string;
    originalUrl?: string;
    body?: Record<string, any>;
}
/**
 * Standardized exception response format for NestJS applications
 */
export interface NestJSExceptionResponse {
    code: string;
    serviceName: string;
    message: string;
    timestamp: string;
    traceId: string;
    statusCode: number;
}
/**
 * NestJS exception filter options
 */
export interface NestJSExceptionFilterOptions {
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
    logger?: Logger;
}
/**
 * NestJS request metadata extraction utility
 */
export interface NestJSRequestMetadata {
    method: string;
    url: string;
    path: string;
    query: Record<string, any>;
    params: Record<string, any>;
    headers: Record<string, string>;
    userAgent: string;
    ip: string;
    controllerName?: string;
    handlerName?: string;
    route?: string;
    originalUrl: string;
    body?: Record<string, any>;
}
/**
 * Exception type mapping for NestJS HTTP exceptions
 */
export interface NestJSExceptionMapping {
    [key: string]: {
        category: string;
        statusCode: number;
        defaultMessage: string;
    };
}
/**
 * NestJS exception filter interface
 */
export interface NestJSExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
}
/**
 * HTTP exception details for transformation
 */
export interface HttpExceptionDetails {
    statusCode: number;
    message: string | string[];
    error?: string;
    code?: string;
}
/**
 * Standardized validation error shape for transformation
 */
export interface ValidationErrorStandardShape {
    code: string;
    message?: string;
    path?: string;
    value?: any;
    constraint?: string;
    originalContext?: Record<string, any>;
}
export {};
//# sourceMappingURL=nestjs.d.ts.map