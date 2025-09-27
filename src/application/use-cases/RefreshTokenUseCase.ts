import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { TokenService } from '../../domain/services/TokenService';
import {
  TokenNotFoundError,
  SessionNotFoundError,
  SessionExpiredError,
  DomainError,
} from '../../shared/errors';

/**
 * Caso de uso: Refresh Token
 * Maneja la renovación de tokens de acceso
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: TokenService
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    try {
      if (!command.refreshToken) {
        throw new TokenNotFoundError();
      }

      if (!this.tokenService.verifyRefreshToken(command.refreshToken)) {
        throw new TokenNotFoundError();
      }

      const session = await this.sessionRepository.findByRefreshToken(command.refreshToken);
      if (!session) {
        throw new SessionNotFoundError();
      }

      if (!session.isActive()) {
        throw new SessionExpiredError();
      }

      const newAccessToken = await this.tokenService.generateAccessToken(
        session.userId,
        session.id
      );

      session.updateLastAccess();
      await this.sessionRepository.update(session);

      return {
        success: true,
        message: 'Token renovado exitosamente',
        accessToken: newAccessToken,
        expiresIn: 15 * 60,
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError(
        500,
        'REFRESH_FAILED',
        'Error interno durante la renovación del token',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}

export interface RefreshTokenCommand {
  refreshToken: string;
}

export interface RefreshTokenResult {
  success: boolean;
  message: string;
  accessToken: string;
  expiresIn: number;
}
