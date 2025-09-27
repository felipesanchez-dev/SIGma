import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { DomainError } from '../../shared/errors';

/**
 * Manejador global de errores para Fastify
 * Convierte errores de dominio en respuestas HTTP consistentes
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  request.log.error(
    {
      error: error.message,
      stack: error.stack,
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
    },
    'Error en request'
  );

  if (error instanceof DomainError) {
    await reply.status(error.status).send({
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  if (error.validation) {
    await reply.status(400).send({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Datos de entrada inválidos',
      details: {
        validationErrors: error.validation,
      },
    });
    return;
  }

  if (error.statusCode === 429) {
    await reply.status(429).send({
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes. Intente nuevamente más tarde.',
      details: {
        retryAfter: reply.getHeader('retry-after'),
      },
    });
    return;
  }

  if (error.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') {
    await reply.status(400).send({
      status: 400,
      code: 'INVALID_CONTENT_TYPE',
      message: 'Tipo de contenido inválido. Use application/json',
    });
    return;
  }

  if (error.code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
    await reply.status(400).send({
      status: 400,
      code: 'EMPTY_BODY',
      message: 'El cuerpo de la solicitud está vacío',
    });
    return;
  }

  if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
    await reply.status(413).send({
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'El cuerpo de la solicitud es demasiado grande',
    });
    return;
  }

  await reply.status(500).send({
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message,
    details: process.env.NODE_ENV === 'production' ? undefined : { stack: error.stack },
  });
}
