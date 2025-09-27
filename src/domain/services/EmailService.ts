import { Email } from '../../domain/entities/Email';
import { VerificationCode } from '../../domain/entities/VerificationCode';

/**
 * Servicio de dominio para el envío de emails
 */
export interface EmailService {
  /**
   * Enviar código de verificación por email
   */
  sendVerificationCode(email: Email, verificationCode: VerificationCode): Promise<void>;

  /**
   * Enviar notificación de registro exitoso
   */
  sendWelcomeEmail(email: Email, userName: string): Promise<void>;

  /**
   * Enviar notificación de nueva sesión
   */
  sendNewSessionNotification(email: Email, deviceInfo: string, ipAddress: string): Promise<void>;

  /**
   * Enviar notificación de bloqueo de cuenta
   */
  sendAccountLockedNotification(email: Email, unlocksAt: Date): Promise<void>;

  /**
   * Enviar notificación de cambio de contraseña
   */
  sendPasswordChangedNotification(email: Email): Promise<void>;

  /**
   * Verificar configuración del servicio de email
   */
  verifyConfiguration(): Promise<boolean>;
}