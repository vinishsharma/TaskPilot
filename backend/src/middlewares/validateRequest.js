import { AppError } from './errorHandler.js';

export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req[source]);
      if (!parsed.success) {
        const errorMessages = parsed.error.errors
          .map((err) => `${err.path.join('.') || 'field'}: ${err.message}`)
          .join(', ');
        return next(new AppError(errorMessages, 400));
      }
      req[source] = parsed.data;
      next();
    } catch (err) {
      next(err);
    }
  };
};
