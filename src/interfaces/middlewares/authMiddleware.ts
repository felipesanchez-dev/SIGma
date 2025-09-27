import { FastifyRequest, FastifyReply } from 'fastify';
import { DIContainer } from '../../infrastructure/container/DIContainer';
import { TokenNotFoundError, InvalidTokenError, TokenExpiredError } from '../../shared/errors';

/**
 * Middleware de autenticación JWT
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new TokenNotFoundError();
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new TokenNotFoundError();
    }

    const container = request.container as DIContainer;
    const tokenService = container.tokenService;

    const payload = await tokenService.verifyAccessToken(token);

    (request as any).user = {
      userId: payload.userId,
      sessionId: payload.sessionId,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    if (
      error instanceof TokenExpiredError ||
      error instanceof InvalidTokenError ||
      error instanceof TokenNotFoundError
    ) {
      throw error;
    }

    throw new InvalidTokenError();
  }
}

/**
 * Middleware opcional de autenticación (no lanza error si no hay token)
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await authMiddleware(request, reply);
  } catch (error) {
    (request as any).user = null;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      sessionId: string;
      iat: number;
      exp: number;
    } | null;
  }
}
