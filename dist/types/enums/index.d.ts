export declare enum ErrorCategoryEnum {
    VALIDATION = "validation",
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    NOT_FOUND = "not_found",
    CONFLICT = "conflict",
    EXTERNAL_SERVICE = "external_service",
    DATABASE = "database",
    NETWORK = "network",
    CONFIGURATION = "configuration",
    INTERNAL = "internal",
    BAD_CONFIG = "bad_config"
}
export type ErrorCategoryType = keyof typeof ErrorCategoryEnum;
export declare enum ErrorLayerEnum {
    APP = "app",
    ROUTER = "router",
    REPOSITORY = "repository",
    SERVICE = "service",
    CONTROLLER = "controller",
    MODEL = "model",
    UTILITY = "utility"
}
export type ErrorLayerType = keyof typeof ErrorLayerEnum;
export declare enum ErrorConstructorEnum {
    ValidationError = "ValidationError",
    ConflictError = "ConflictError",
    ExternalServiceError = "ExternalServiceError",
    DatabaseError = "DatabaseError",
    InternalError = "InternalError",
    NotFoundError = "NotFoundError",
    NetworkError = "NetworkError",
    AuthorizationError = "AuthorizationError",
    AuthenticationError = "AuthenticationError",
    BadConfigError = "BadConfigError"
}
export type ErrorConstructorType = keyof typeof ErrorConstructorEnum;
export declare enum NetworkErrorCodesEnum {
    INVALID_URL = "INVALID_URL",
    SERVER_NOT_REACHABLE = "SERVER_NOT_REACHABLE",
    REQUEST_TIMEOUT = "REQUEST_TIMEOUT",
    REQUEST_CANCELED = "REQUEST_CANCELED",
    BAD_CONFIGURATION = "BAD_CONFIGURATION",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    TOO_MANY_REDIRECTS = "TOO_MANY_REDIRECTS"
}
export type NetworkErrorCodesType = keyof typeof NetworkErrorCodesEnum;
export declare enum DatabaseErrorCodesEnum {
    DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR",
    DATABASE_QUERY_ERROR = "DATABASE_QUERY_ERROR",
    DATABASE_TRANSACTION_ERROR = "DATABASE_TRANSACTION_ERROR",
    DATABASE_VALIDATION_ERROR = "DATABASE_VALIDATION_ERROR",
    DATABASE_TIMEOUT_ERROR = "DATABASE_TIMEOUT_ERROR"
}
export type DatabaseErrorCodesType = keyof typeof DatabaseErrorCodesEnum;
//# sourceMappingURL=index.d.ts.map