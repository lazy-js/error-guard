export var ErrorCategoryEnum;
(function (ErrorCategoryEnum) {
    ErrorCategoryEnum["VALIDATION"] = "validation";
    ErrorCategoryEnum["AUTHENTICATION"] = "authentication";
    ErrorCategoryEnum["AUTHORIZATION"] = "authorization";
    ErrorCategoryEnum["NOT_FOUND"] = "not_found";
    ErrorCategoryEnum["CONFLICT"] = "conflict";
    ErrorCategoryEnum["EXTERNAL_SERVICE"] = "external_service";
    ErrorCategoryEnum["DATABASE"] = "database";
    ErrorCategoryEnum["NETWORK"] = "network";
    ErrorCategoryEnum["CONFIGURATION"] = "configuration";
    ErrorCategoryEnum["INTERNAL"] = "internal";
    ErrorCategoryEnum["BAD_CONFIG"] = "bad_config";
    ErrorCategoryEnum["TRANSFORMATION"] = "transformation";
})(ErrorCategoryEnum || (ErrorCategoryEnum = {}));
export var ErrorLayerEnum;
(function (ErrorLayerEnum) {
    ErrorLayerEnum["APP"] = "app";
    ErrorLayerEnum["ROUTER"] = "router";
    ErrorLayerEnum["REPOSITORY"] = "repository";
    ErrorLayerEnum["SERVICE"] = "service";
    ErrorLayerEnum["CONTROLLER"] = "controller";
    ErrorLayerEnum["MODEL"] = "model";
    ErrorLayerEnum["UTILITY"] = "utility";
})(ErrorLayerEnum || (ErrorLayerEnum = {}));
export var ErrorConstructorEnum;
(function (ErrorConstructorEnum) {
    ErrorConstructorEnum["ValidationError"] = "ValidationError";
    ErrorConstructorEnum["ConflictError"] = "ConflictError";
    ErrorConstructorEnum["ExternalServiceError"] = "ExternalServiceError";
    ErrorConstructorEnum["DatabaseError"] = "DatabaseError";
    ErrorConstructorEnum["InternalError"] = "InternalError";
    ErrorConstructorEnum["NotFoundError"] = "NotFoundError";
    ErrorConstructorEnum["NetworkError"] = "NetworkError";
    ErrorConstructorEnum["AuthorizationError"] = "AuthorizationError";
    ErrorConstructorEnum["AuthenticationError"] = "AuthenticationError";
    ErrorConstructorEnum["BadConfigError"] = "BadConfigError";
    ErrorConstructorEnum["TransformationError"] = "TransformationError";
})(ErrorConstructorEnum || (ErrorConstructorEnum = {}));
export var NetworkErrorCodesEnum;
(function (NetworkErrorCodesEnum) {
    NetworkErrorCodesEnum["INVALID_URL"] = "INVALID_URL";
    NetworkErrorCodesEnum["SERVER_NOT_REACHABLE"] = "SERVER_NOT_REACHABLE";
    NetworkErrorCodesEnum["REQUEST_TIMEOUT"] = "REQUEST_TIMEOUT";
    NetworkErrorCodesEnum["REQUEST_CANCELED"] = "REQUEST_CANCELED";
    NetworkErrorCodesEnum["BAD_CONFIGURATION"] = "BAD_CONFIGURATION";
    NetworkErrorCodesEnum["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    NetworkErrorCodesEnum["TOO_MANY_REDIRECTS"] = "TOO_MANY_REDIRECTS";
})(NetworkErrorCodesEnum || (NetworkErrorCodesEnum = {}));
export var DatabaseErrorCodesEnum;
(function (DatabaseErrorCodesEnum) {
    DatabaseErrorCodesEnum["DATABASE_CONNECTION_ERROR"] = "DATABASE_CONNECTION_ERROR";
    DatabaseErrorCodesEnum["DATABASE_QUERY_ERROR"] = "DATABASE_QUERY_ERROR";
    DatabaseErrorCodesEnum["DATABASE_TRANSACTION_ERROR"] = "DATABASE_TRANSACTION_ERROR";
    DatabaseErrorCodesEnum["DATABASE_VALIDATION_ERROR"] = "DATABASE_VALIDATION_ERROR";
    DatabaseErrorCodesEnum["DATABASE_TIMEOUT_ERROR"] = "DATABASE_TIMEOUT_ERROR";
})(DatabaseErrorCodesEnum || (DatabaseErrorCodesEnum = {}));
//# sourceMappingURL=index.js.map