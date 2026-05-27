/**
 * Production-ready Global Async Error Boundary Middleware
 * Ensures no internal database schema details or raw stacks are exposed under NODE_ENV === 'production'
 */
export const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  
  // Log server-side for internal diagnosis
  console.error('[Error Boundary Caught]:', {
    message: err.message,
    stack: isProd ? 'HIDDEN' : err.stack,
    timestamp: new Date().toISOString()
  });

  const statusCode = err.status || 500;
  
  res.status(statusCode).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: statusCode === 500 && isProd
      ? 'An unexpected error occurred on the server. Please try again later.'
      : err.message
  });
};
