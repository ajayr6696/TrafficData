import logger from '../logger/index.js';

const apiErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    logger.error({ err }, 'Unhandled API error');
  }

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    details: err.details,
  });
};

export default apiErrorHandler;
