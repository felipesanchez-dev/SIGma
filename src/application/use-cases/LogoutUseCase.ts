import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { SessionNotFoundError, DomainError } from '../../shared/errors';

/**
 * Caso de uso: Logout
 * Maneja el cierre de sesión
 */
export class LogoutUseCase {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(command: LogoutCommand): Promise<LogoutResult> {
    try {
      let session = null;

      if (command.sessionId) {
        session = await this.sessionRepository.findById(command.sessionId);
      } else if (command.refreshToken) {
        session = await this.sessionRepository.findByRefreshToken(command.refreshToken);
      } else if (command.deviceId && command.userId) {
        session = await this.sessionRepository.findByUserIdAndDeviceId(
          command.userId,
          command.deviceId
        );
      }

      if (!session) {
        throw new SessionNotFoundError();
      }

      session.revoke();
      await this.sessionRepository.update(session);

      return {
        success: true,
        message: 'Sesión cerrada exitosamente',
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError(500, 'LOGOUT_FAILED', 'Error interno durante el logout', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Caso de uso: Logout de todas las sesiones
 * Revoca todas las sesiones de un usuario
 */
export class LogoutAllUseCase {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(command: LogoutAllCommand): Promise<LogoutResult> {
    try {
      await this.sessionRepository.revokeAllByUserId(command.userId);

      return {
        success: true,
        message: 'Todas las sesiones han sido cerradas exitosamente',
      };
    } catch (error) {
      throw new DomainError(500, 'LOGOUT_ALL_FAILED', 'Error interno durante el logout masivo', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export interface LogoutCommand {
  sessionId?: string;
  refreshToken?: string;
  deviceId?: string;
  userId?: string;
}

export interface LogoutAllCommand {
  userId: string;
}

export interface LogoutResult {
  success: boolean;
  message: string;
}
