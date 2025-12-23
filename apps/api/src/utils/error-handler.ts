import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // JWT errors
  if (error.statusCode === 401) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  // Log error
  request.log.error(error);

  return reply.status(statusCode).send({
    success: false,
    error: statusCode === 500 ? 'Internal server error' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

