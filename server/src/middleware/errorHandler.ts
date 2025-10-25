import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle different types of errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(error.errors).map(err => err.message).join(', ');
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${error.path}: ${error.value}`;
  } else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry found';
  }

  // Log error in development
  if (process.env['NODE_ENV'] === 'development') {
    console.error('Error:', error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack })
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${_req.originalUrl} not found`, 404);
  next(error);
};
