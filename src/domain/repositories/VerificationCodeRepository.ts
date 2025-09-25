import { VerificationCode } from '@domain/entities/VerificationCode';
import { Email } from '@domain/entities/Email';

/**
 * Repositorio para la entidad VerificationCode
 */
export interface VerificationCodeRepository {
  /**
   * Guardar nuevo código de verificación
   */
  save(verificationCode: VerificationCode): Promise<VerificationCode>;

  /**
   * Buscar código de verificación por email y código
   */
  findByEmailAndCode(email: Email, code: string): Promise<VerificationCode | null>;

  /**
   * Buscar códigos activos por email
   */
  findActiveByEmail(email: Email): Promise<VerificationCode[]>;

  /**
   * Actualizar código de verificación
   */
  update(verificationCode: VerificationCode): Promise<VerificationCode>;

  /**
   * Eliminar código de verificación
   */
  delete(id: string): Promise<void>;

  /**
   * Eliminar códigos expirados
   */
  deleteExpired(): Promise<number>;

  /**
   * Revocar todos los códigos activos para un email
   */
  revokeAllByEmail(email: Email): Promise<void>;
}