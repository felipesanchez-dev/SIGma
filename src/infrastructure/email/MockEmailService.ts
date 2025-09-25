import { EmailService } from '@domain/services/EmailService';
import { Email } from '@domain/entities/Email';
import { VerificationCode } from '@domain/entities/VerificationCode';

/**
 * Mock EmailService para testing sin configuración SMTP
 * Simula envío de emails exitoso y muestra códigos en consola
 */
export class MockEmailService implements EmailService {
  async sendVerificationCode(email: Email, verificationCode: VerificationCode): Promise<void> {
    console.log(`📧 [MOCK EMAIL] Código de verificación para ${email.value}: ${verificationCode.code}`);
    console.log(`⏰ [MOCK EMAIL] Expira: ${verificationCode.expiresAt.toLocaleString()}`);
    
    // Simular delay de envío de email
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async sendWelcomeEmail(email: Email, userName: string): Promise<void> {
    console.log(`🎉 [MOCK EMAIL] Email de bienvenida enviado a ${email.value} (${userName})`);
  }

  async sendNewSessionNotification(
    email: Email, 
    deviceInfo: string, 
    ipAddress: string
  ): Promise<void> {
    console.log(`🔒 [MOCK EMAIL] Nueva sesión detectada para ${email.value} desde ${deviceInfo} (${ipAddress})`);
  }

  async sendAccountLockedNotification(email: Email, unlocksAt: Date): Promise<void> {
    console.log(`⚠️ [MOCK EMAIL] Cuenta bloqueada para ${email.value}. Desbloquea: ${unlocksAt.toLocaleString()}`);
  }

  async sendPasswordChangedNotification(email: Email): Promise<void> {
    console.log(`🔑 [MOCK EMAIL] Contraseña cambiada para ${email.value}`);
  }

  async verifyConfiguration(): Promise<boolean> {
    console.log(`✅ [MOCK EMAIL] Configuración verificada (modo mock)`);
    return true;
  }
}