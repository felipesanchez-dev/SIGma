import { Email } from '../../domain/entities/Email';
import { Password } from '../../domain/entities/Password';
import { Session, DeviceMeta } from '../../domain/entities/Session';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { PasswordService } from '../../domain/services/PasswordService';
import { TokenService } from '../../domain/services/TokenService';
import { EmailService } from '../../domain/services/EmailService';
import {
  UserNotFoundError,
  InvalidCredentialsError,
  UserNotVerifiedError,
  MaxSessionsExceededError,
  DomainError,
} from '../../shared/errors';

const generateUUID = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Caso de uso: Login de Usuario
 * Maneja la autenticación y creación de sesiones (Multi sesión)
 */
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly maxConcurrentSessions: number = 4
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    try {
      const email = Email.create(command.email);
      const password = Password.create(command.password);

      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new UserNotFoundError(command.email);
      }

      const isValidPassword = await this.passwordService.verify(password, user.hashedPassword);
      if (!isValidPassword) {
        user.recordFailedLogin();
        await this.userRepository.update(user);
        throw new InvalidCredentialsError();
      }

      if (user.isPendingVerification()) {
        throw new UserNotVerifiedError();
      }

      if (!user.isActive()) {
        if (user.isLocked()) {
          const unlocksAt = user.lockedUntil!;
          await this.emailService.sendAccountLockedNotification(email, unlocksAt);
          throw new DomainError(
            423,
            'ACCOUNT_LOCKED',
            `Cuenta bloqueada hasta ${unlocksAt.toLocaleString('es-ES')} por múltiples intentos fallidos`
          );
        }
        throw new DomainError(403, 'ACCOUNT_SUSPENDED', 'Cuenta suspendida');
      }

      const activeSessions = await this.sessionRepository.findActiveByUserId(user.id);

      const existingSession = await this.sessionRepository.findByUserIdAndDeviceId(
        user.id,
        command.deviceId
      );

      if (existingSession) {
        const newRefreshToken = this.tokenService.generateRefreshToken();
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

        existingSession.updateRefreshToken(newRefreshToken, newExpiresAt);
        await this.sessionRepository.update(existingSession);

        const accessToken = await this.tokenService.generateAccessToken(
          user.id,
          existingSession.id
        );

        user.recordSuccessfulLogin();
        await this.userRepository.update(user);

        return {
          success: true,
          message: 'Sesión actualizada exitosamente',
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: 15 * 60,
          user: {
            id: user.id,
            email: user.email.value,
            name: user.name,
            tenantType: user.tenantType,
            status: user.status,
          },
        };
      }

      if (activeSessions.length >= this.maxConcurrentSessions) {
        throw new MaxSessionsExceededError(this.maxConcurrentSessions);
      }

      const refreshToken = this.tokenService.generateRefreshToken();
      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

      const session = new Session(
        generateUUID(),
        user.id,
        command.deviceId,
        command.deviceMeta,
        refreshToken,
        sessionExpiresAt
      );

      await this.sessionRepository.save(session);

      const accessToken = await this.tokenService.generateAccessToken(user.id, session.id);

      user.recordSuccessfulLogin();
      await this.userRepository.update(user);

      if (activeSessions.length > 0) {
        await this.emailService.sendNewSessionNotification(
          email,
          `${command.deviceMeta.browser} en ${command.deviceMeta.os}`,
          command.deviceMeta.ipAddress
        );
      }

      return {
        success: true,
        message: 'Login exitoso',
        accessToken,
        refreshToken,
        expiresIn: 15 * 60,
        user: {
          id: user.id,
          email: user.email.value,
          name: user.name,
          tenantType: user.tenantType,
          status: user.status,
        },
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError(500, 'LOGIN_FAILED', 'Error interno durante el login', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export interface LoginUserCommand {
  email: string;
  password: string;
  deviceId: string;
  deviceMeta: DeviceMeta;
}

export interface LoginUserResult {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    tenantType: string;
    status: string;
  };
}
