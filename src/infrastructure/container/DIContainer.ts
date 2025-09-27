import { UserRepository } from '@domain/repositories/UserRepository';
import { VerificationCodeRepository } from '@domain/repositories/VerificationCodeRepository';
import { SessionRepository } from '@domain/repositories/SessionRepository';
import { PasswordService } from '@domain/services/PasswordService';
import { TokenService } from '@domain/services/TokenService';
import { EmailService } from '@domain/services/EmailService';
import { RegisterUserUseCase } from '@application/use-cases/RegisterUserUseCase';
import { VerifyUserUseCase } from '@application/use-cases/VerifyUserUseCase';
import { LoginUserUseCase } from '@application/use-cases/LoginUserUseCase';
import { RefreshTokenUseCase } from '@application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase, LogoutAllUseCase } from '@application/use-cases/LogoutUseCase';
import { MongoUserRepository } from '../database/repositories/MongoUserRepository';
import { MongoVerificationCodeRepository } from '../database/repositories/MongoVerificationCodeRepository';
import { MongoSessionRepository } from '../database/repositories/MongoSessionRepository';
import { VerificationCodeModel } from '../database/models/VerificationCodeModel';
import { SessionModel } from '../database/models/SessionModel';
import { Argon2PasswordService } from '../crypto/Argon2PasswordService';
import { JwtTokenService } from '../crypto/JwtTokenService';
import { NodemailerEmailService } from '../email/NodemailerEmailService';
import { MockEmailService } from '../email/MockEmailService';

/**
 * Contenedor de Inyección de Dependencias para SIGma
 * Implementa el patrón Dependency Injection Container
 */
export class DIContainer {
  private static instance: DIContainer;

  private _passwordService?: PasswordService;
  private _tokenService?: TokenService;
  private _emailService?: EmailService;

  private _userRepository?: UserRepository;
  private _verificationCodeRepository?: VerificationCodeRepository;
  private _sessionRepository?: SessionRepository;

  private _registerUserUseCase?: RegisterUserUseCase;
  private _verifyUserUseCase?: VerifyUserUseCase;
  private _loginUserUseCase?: LoginUserUseCase;
  private _refreshTokenUseCase?: RefreshTokenUseCase;
  private _logoutUseCase?: LogoutUseCase;
  private _logoutAllUseCase?: LogoutAllUseCase;

  private constructor() {}

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  public get passwordService(): PasswordService {
    if (!this._passwordService) {
      const memorySize = parseInt(process.env.ARGON2_MEMORY_SIZE || '65536', 10);
      const timeCost = parseInt(process.env.ARGON2_TIME_COST || '3', 10);
      const parallelism = parseInt(process.env.ARGON2_PARALLELISM || '1', 10);

      this._passwordService = new Argon2PasswordService(memorySize, timeCost, parallelism);
    }
    return this._passwordService;
  }

  public get tokenService(): TokenService {
    if (!this._tokenService) {
      const privateKey = process.env.JWT_PRIVATE_KEY!;
      const publicKey = process.env.JWT_PUBLIC_KEY!;
      const issuer = 'SIGma-System';
      const audience = 'SIGma-Users';
      const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

      this._tokenService = new JwtTokenService(privateKey, publicKey, issuer, audience, expiresIn);
    }
    return this._tokenService;
  }

  public get emailService(): EmailService {
    if (!this._emailService) {
      // Usar MockEmailService si no hay credenciales configuradas
      const user = process.env.SMTP_USER;
      const password = process.env.SMTP_PASS;

      if (!user || !password || password === 'TU_APP_PASSWORD_AQUI') {
        console.log('Usando MockEmailService (credenciales no configuradas)');
        this._emailService = new MockEmailService();
      } else {
        const host = process.env.SMTP_HOST!;
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        const secure = process.env.SMTP_SECURE === 'true';
        const fromName = process.env.EMAIL_FROM_NAME || 'SIGma System';
        const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@sigma.com';

        this._emailService = new NodemailerEmailService(
          host,
          port,
          secure,
          user,
          password,
          fromName,
          fromAddress
        );
      }
    }
    return this._emailService;
  }

  public get userRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new MongoUserRepository();
    }
    return this._userRepository;
  }

  public get verificationCodeRepository(): VerificationCodeRepository {
    if (!this._verificationCodeRepository) {
      this._verificationCodeRepository = new MongoVerificationCodeRepository(VerificationCodeModel);
    }
    return this._verificationCodeRepository;
  }

  public get sessionRepository(): SessionRepository {
    if (!this._sessionRepository) {
      this._sessionRepository = new MongoSessionRepository(SessionModel);
    }
    return this._sessionRepository;
  }

  public get registerUserUseCase(): RegisterUserUseCase {
    if (!this._registerUserUseCase) {
      this._registerUserUseCase = new RegisterUserUseCase(
        this.userRepository,
        this.verificationCodeRepository,
        this.passwordService,
        this.emailService
      );
    }
    return this._registerUserUseCase;
  }

  public get verifyUserUseCase(): VerifyUserUseCase {
    if (!this._verifyUserUseCase) {
      this._verifyUserUseCase = new VerifyUserUseCase(
        this.userRepository,
        this.verificationCodeRepository,
        this.emailService
      );
    }
    return this._verifyUserUseCase;
  }

  public get loginUserUseCase(): LoginUserUseCase {
    if (!this._loginUserUseCase) {
      const maxSessions = parseInt(process.env.MAX_CONCURRENT_SESSIONS || '4', 10);

      this._loginUserUseCase = new LoginUserUseCase(
        this.userRepository,
        this.sessionRepository,
        this.passwordService,
        this.tokenService,
        this.emailService,
        maxSessions
      );
    }
    return this._loginUserUseCase;
  }

  public get refreshTokenUseCase(): RefreshTokenUseCase {
    if (!this._refreshTokenUseCase) {
      this._refreshTokenUseCase = new RefreshTokenUseCase(
        this.sessionRepository,
        this.tokenService
      );
    }
    return this._refreshTokenUseCase;
  }

  public get logoutUseCase(): LogoutUseCase {
    if (!this._logoutUseCase) {
      this._logoutUseCase = new LogoutUseCase(this.sessionRepository);
    }
    return this._logoutUseCase;
  }

  public get logoutAllUseCase(): LogoutAllUseCase {
    if (!this._logoutAllUseCase) {
      this._logoutAllUseCase = new LogoutAllUseCase(this.sessionRepository);
    }
    return this._logoutAllUseCase;
  }

  /**
   * Verificar configuración de servicios
   */
  public async verifyConfiguration(): Promise<boolean> {
    try {
      const emailConfigValid = await this.emailService.verifyConfiguration();
      if (!emailConfigValid) {
        console.warn('Configuración de email inválida');
        return false;
      }

      const tokenService = this.tokenService as JwtTokenService;
      const tokenConfigValid = tokenService.validateKeys();
      if (!tokenConfigValid) {
        console.warn('Configuración de JWT inválida');
        return false;
      }

      console.log('Configuración de servicios verificada');
      return true;
    } catch (error) {
      console.error('Error verificando configuración:', error);
      return false;
    }
  }
}

/**
 * Función factory para crear el contenedor
 */
export function createContainer(): DIContainer {
  return DIContainer.getInstance();
}
