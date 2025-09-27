import { Email } from '../../domain/entities/Email';
import { Password } from '../../domain/entities/Password';
import { Phone } from '../../domain/entities/Phone';
import { User } from '../../domain/entities/User';
import { VerificationCode } from '../../domain/entities/VerificationCode';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { VerificationCodeRepository } from '../../domain/repositories/VerificationCodeRepository';
import { PasswordService } from '../../domain/services/PasswordService';
import { EmailService } from '../../domain/services/EmailService';
import { UserAlreadyExistsError, InvalidTenantTypeError, DomainError } from '../../shared/errors';
import { TenantType } from '../../shared/types';
const generateUUID = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Caso de uso: Registro de Usuario
 * Maneja el proceso completo de registro inicial
 */
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationCodeRepository: VerificationCodeRepository,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    try {
      this.validateTenantType(command.tenantType);

      const email = Email.create(command.email);
      const phone = Phone.create(command.phone);
      const password = Password.create(command.password);

      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new UserAlreadyExistsError(command.email);
      }

      const hashedPassword = await this.passwordService.hash(password);

      const user =
        command.tenantType === 'profesional'
          ? User.createProfessional(
              generateUUID(),
              email,
              hashedPassword,
              phone,
              command.name,
              command.country,
              command.city
            )
          : User.createCompany(
              generateUUID(),
              email,
              hashedPassword,
              phone,
              command.name,
              command.country,
              command.city
            );

      await this.userRepository.save(user);

      const verificationCode = VerificationCode.create(generateUUID(), email, 15 * 60 * 1000);

      await this.verificationCodeRepository.save(verificationCode);

      await this.emailService.sendVerificationCode(email, verificationCode);

      return {
        success: true,
        message:
          'Usuario registrado exitosamente. Se ha enviado un código de verificación a su email.',
        userId: user.id,
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError(500, 'REGISTRATION_FAILED', 'Error interno durante el registro', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private validateTenantType(tenantType: string): void {
    const validTypes: TenantType[] = ['profesional', 'empresa'];
    if (!validTypes.includes(tenantType as TenantType)) {
      throw new InvalidTenantTypeError(tenantType);
    }
  }
}

export interface RegisterUserCommand {
  email: string;
  phone: string;
  name: string;
  country: string;
  city: string;
  password: string;
  tenantType: TenantType;
}

export interface RegisterUserResult {
  success: boolean;
  message: string;
  userId: string;
}
