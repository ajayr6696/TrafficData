import HttpError from '../error/HttpError.js';

const notFound = (req, res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFound;
