import HttpError from '../error/HttpError.js';
import { errorHandler } from '../util/handlers.js';

const requestSource = (req) => {
  if (req.method === 'GET' || req.method === 'DELETE') {
    return req.query;
  }

  return req.body;
};

const validateSchema = (schema) => errorHandler(async (req, res, next) => {
  const dataToValidate = requestSource(req);
  const valid = schema(dataToValidate);

  if (!valid) {
    throw new HttpError(
      400,
      'Request validation failed',
      schema.errors?.map((error) => ({
        path: error.instancePath || error.params?.missingProperty || '/',
        message: error.message,
      })),
    );
  }

  next();
});

export default validateSchema;
