import { Email } from '@domain/entities/Email';
import { UserRepository } from '@domain/repositories/UserRepository';
import { VerificationCodeRepository } from '@domain/repositories/VerificationCodeRepository';
import { EmailService } from '@domain/services/EmailService';
import {
  UserNotFoundError,
  VerificationCodeNotFoundError,
  InvalidVerificationCodeError,
  VerificationCodeExpiredError,
  DomainError,
} from '@shared/errors';

/**
 * Caso de uso: Verificar Usuario
 * Maneja la verificación de código enviado por email
 */
export class VerifyUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationCodeRepository: VerificationCodeRepository,
    private readonly emailService: EmailService
  ) {}

  async execute(command: VerifyUserCommand): Promise<VerifyUserResult> {
    try {
      const verificationCode = await this.verificationCodeRepository.findByCode(command.code);

      if (!verificationCode) {
        throw new VerificationCodeNotFoundError();
      }

      verificationCode.incrementAttempts();
      await this.verificationCodeRepository.update(verificationCode);

      if (verificationCode.isExpired()) {
        throw new VerificationCodeExpiredError();
      }

      if (!verificationCode.isValid()) {
        throw new InvalidVerificationCodeError();
      }

      // Buscar el usuario por el email del código de verificación
      const email = Email.create(verificationCode.email.value);
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        throw new UserNotFoundError(verificationCode.email.value);
      }

      verificationCode.use();
      await this.verificationCodeRepository.update(verificationCode);

      user.verify();
      await this.userRepository.update(user);

      await this.verificationCodeRepository.revokeAllByEmail(email);

      await this.emailService.sendWelcomeEmail(email, user.name);

      return {
        success: true,
        message: 'Cuenta verificada exitosamente. ¡Bienvenido a SIGma!',
        userId: user.id,
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError(500, 'VERIFICATION_FAILED', 'Error interno durante la verificación', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export interface VerifyUserCommand {
  code: string;
}

export interface VerifyUserResult {
  success: boolean;
  message: string;
  userId: string;
}
