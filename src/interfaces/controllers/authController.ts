import { FastifyRequest, FastifyReply } from 'fastify';
import { DIContainer } from '../../infrastructure/container/DIContainer';
import { DomainError } from '../../shared/errors';
import { TenantType } from '../../shared/types';
import { DeviceMeta } from '../../domain/entities/Session';

/**
 * Controlador de autenticación
 * Maneja las solicitudes HTTP y coordina con los casos de uso
 */
class AuthController {
  async register(
    request: FastifyRequest<{
      Body: {
        email: string;
        phone: string;
        name: string;
        country: string;
        city: string;
        password: string;
        tenantType: TenantType;
      };
    }>,
    reply: FastifyReply,
    container: DIContainer
  ): Promise<void> {
    try {
      const registerUseCase = container.registerUserUseCase;
      const result = await registerUseCase.execute(request.body);

      await reply.status(202).send(result);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      request.log.error(
        `Error en registro: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new DomainError(500, 'REGISTRATION_ERROR', 'Error interno durante el registro');
    }
  }

  async verify(
    request: FastifyRequest<{
      Body: {
        email: string;
        code: string;
      };
    }>,
    reply: FastifyReply,
    container: DIContainer
  ): Promise<void> {
    try {
      const verifyUseCase = container.verifyUserUseCase;
      const result = await verifyUseCase.execute(request.body);

      await reply.status(200).send(result);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      request.log.error(
        `Error en verificación: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new DomainError(500, 'VERIFICATION_ERROR', 'Error interno durante la verificación');
    }
  }

  async login(
    request: FastifyRequest<{
      Body: {
        email: string;
        password: string;
        deviceId: string;
        deviceMeta: DeviceMeta;
      };
    }>,
    reply: FastifyReply,
    container: DIContainer
  ): Promise<void> {
    try {
      const deviceMeta = {
        ...request.body.deviceMeta,
        ipAddress: request.body.deviceMeta.ipAddress || request.ip,
      };

      const loginUseCase = container.loginUserUseCase;
      const result = await loginUseCase.execute({
        ...request.body,
        deviceMeta,
      });

      await reply.status(200).send(result);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      request.log.error(
        `Error en login: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new DomainError(500, 'LOGIN_ERROR', 'Error interno durante el login');
    }
  }

  async refresh(
    request: FastifyRequest<{
      Body: {
        refreshToken: string;
      };
    }>,
    reply: FastifyReply,
    container: DIContainer
  ): Promise<void> {
    try {
      const refreshUseCase = container.refreshTokenUseCase;
      const result = await refreshUseCase.execute(request.body);

      await reply.status(200).send(result);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      request.log.error(
        `Error en refresh: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new DomainError(500, 'REFRESH_ERROR', 'Error interno durante la renovación del token');
    }
  }

  async logout(
    request: FastifyRequest<{
      Body: {
        refreshToken?: string;
        deviceId?: string;
        userId?: string;
      };
    }>,
    reply: FastifyReply,
    container: DIContainer
  ): Promise<void> {
    try {
      const logoutUseCase = container.logoutUseCase;
      const result = await logoutUseCase.execute(request.body);

      await reply.status(200).send(result);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      request.log.error(
        `Error en logout: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new DomainError(500, 'LOGOUT_ERROR', 'Error interno durante el logout');
    }
  }

  async logoutAll(
    request: FastifyRequest,
    reply: FastifyReply,
    container: DIContainer
  ): Promise<void> {
    try {
      const user = (request as any).user;
      if (!user) {
        throw new DomainError(401, 'UNAUTHORIZED', 'Token de acceso requerido');
      }

      const logoutAllUseCase = container.logoutAllUseCase;
      const result = await logoutAllUseCase.execute({ userId: user.userId });

      await reply.status(200).send(result);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      request.log.error(
        `Error en logout all: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new DomainError(500, 'LOGOUT_ALL_ERROR', 'Error interno durante el logout masivo');
    }
  }
}

export const authController = new AuthController();
