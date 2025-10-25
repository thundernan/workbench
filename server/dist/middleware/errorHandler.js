"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.asyncHandler = exports.errorHandler = exports.AppError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (error, _req, res, _next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    }
    else if (error instanceof mongoose_1.default.Error.ValidationError) {
        statusCode = 400;
        message = Object.values(error.errors).map(err => err.message).join(', ');
    }
    else if (error instanceof mongoose_1.default.Error.CastError) {
        statusCode = 400;
        message = `Invalid ${error.path}: ${error.value}`;
    }
    else if (error.name === 'MongoServerError' && error.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry found';
    }
    if (process.env['NODE_ENV'] === 'development') {
        console.error('Error:', error);
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack })
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const notFound = (_req, _res, next) => {
    const error = new AppError(`Route ${_req.originalUrl} not found`, 404);
    next(error);
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map