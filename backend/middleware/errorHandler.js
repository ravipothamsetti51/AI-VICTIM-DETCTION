const errorHandler = (err, req, res, next) => {
  console.error(`[!] API Error: ${err.message}`, err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Tactical Server Error';
  let errorType = err.name || 'ServerError';

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `Resource not found with specified identifier: ${err.value}`;
    errorType = 'ResourceNotFound';
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
    errorType = 'ValidationError';
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for: ${field}. Must be unique.`;
    errorType = 'DuplicateKeyError';
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: errorType,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
