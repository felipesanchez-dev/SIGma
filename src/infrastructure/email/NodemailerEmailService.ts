import { EmailService } from '../../domain/services/EmailService';
import { Email } from '../../domain/entities/Email';
import { VerificationCode } from '../../domain/entities/VerificationCode';
import * as nodemailer from 'nodemailer';

/**
 * Implementación del servicio de email usando Nodemailer
 * Configurado para SMTP seguro con autenticación
 */
export class NodemailerEmailService implements EmailService {
  private transporter: nodemailer.Transporter;
  private readonly fromName: string;
  private readonly fromAddress: string;

  constructor(
    host: string,
    port: number,
    secure: boolean,
    user: string,
    password: string,
    fromName: string = 'SIGma System',
    fromAddress: string = 'noreply@sigma.com'
  ) {
    this.fromName = fromName;
    this.fromAddress = fromAddress;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  async sendVerificationCode(email: Email, verificationCode: VerificationCode): Promise<void> {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromAddress}>`,
        to: email.value,
        subject: 'Verificación de cuenta - SIGma',
        html: this.getVerificationCodeTemplate(verificationCode.code),
        text: `Su código de verificación es: ${verificationCode.code}. Este código expira en 15 minutos.`,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(
        `Error enviando código de verificación: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async sendWelcomeEmail(email: Email, userName: string): Promise<void> {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromAddress}>`,
        to: email.value,
        subject: '¡Bienvenido a SIGma! - Cuenta verificada',
        html: this.getWelcomeTemplate(userName),
        text: `¡Hola ${userName}! Tu cuenta en SIGma ha sido verificada exitosamente. Bienvenido a nuestra plataforma.`,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(
        `Error enviando email de bienvenida: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async sendNewSessionNotification(
    email: Email,
    deviceInfo: string,
    ipAddress: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromAddress}>`,
        to: email.value,
        subject: 'Nueva sesión detectada - SIGma',
        html: this.getNewSessionTemplate(deviceInfo, ipAddress),
        text: `Se ha detectado un nuevo inicio de sesión en su cuenta desde ${deviceInfo} (IP: ${ipAddress}).`,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error enviando notificación de nueva sesión:', error);
    }
  }

  async sendAccountLockedNotification(email: Email, unlocksAt: Date): Promise<void> {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromAddress}>`,
        to: email.value,
        subject: 'Cuenta bloqueada por seguridad - SIGma',
        html: this.getAccountLockedTemplate(unlocksAt),
        text: `Su cuenta ha sido bloqueada temporalmente por múltiples intentos fallidos. Se desbloqueará el ${unlocksAt.toLocaleString('es-ES')}.`,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(
        `Error enviando notificación de bloqueo: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async sendPasswordChangedNotification(email: Email): Promise<void> {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromAddress}>`,
        to: email.value,
        subject: 'Contraseña actualizada - SIGma',
        html: this.getPasswordChangedTemplate(),
        text: 'Su contraseña ha sido actualizada exitosamente.',
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error enviando notificación de cambio de contraseña:', error);
    }
  }

  async verifyConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }

  private getVerificationCodeTemplate(code: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación de cuenta</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">SIGma (Σ)</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestión Modular</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <h2 style="color: #333; margin-top: 0;">Verificación de Cuenta</h2>
            <p>Para completar el registro de su cuenta, ingrese el siguiente código de verificación:</p>
            
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <h3 style="margin: 0; font-size: 32px; color: #667eea; letter-spacing: 5px; font-family: monospace;">${code}</h3>
            </div>
            
            <p style="color: #666; font-size: 14px;">
                <strong>Importante:</strong> Este código expira en 15 minutos por seguridad.
                Si no solicitó este registro, puede ignorar este email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888;">
                <p>© 2025 SIGma System. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getWelcomeTemplate(userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">¡Bienvenido a SIGma!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <h2>Hola ${userName},</h2>
            <p>¡Felicitaciones! Tu cuenta ha sido verificada exitosamente y ya puedes acceder a todas las funcionalidades de SIGma.</p>
            
            <div style="background: #e8f5e8; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2e7d32;">¿Qué puedes hacer ahora?</h3>
                <ul style="margin: 0;">
                    <li>Acceder a tu panel de control personalizado</li>
                    <li>Configurar tu perfil profesional</li>
                    <li>Explorar las herramientas disponibles</li>
                    <li>Conectar con otros profesionales</li>
                </ul>
            </div>
            
            <p>Si tienes alguna pregunta, nuestro equipo de soporte está disponible para ayudarte.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888;">
                <p>© 2025 SIGma System. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getNewSessionTemplate(deviceInfo: string, ipAddress: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ff9800; padding: 20px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Nueva Sesión Detectada</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <p>Se ha detectado un nuevo inicio de sesión en su cuenta:</p>
            
            <div style="background: #fff; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 15px 0;">
                <p><strong>Dispositivo:</strong> ${deviceInfo}</p>
                <p><strong>Dirección IP:</strong> ${ipAddress}</p>
                <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-ES')}</p>
            </div>
            
            <p>Si no reconoce esta actividad, cambie su contraseña inmediatamente y contacte a soporte.</p>
        </div>
    </body>
    </html>
    `;
  }

  private getAccountLockedTemplate(unlocksAt: Date): string {
    return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f44336; padding: 20px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Cuenta Bloqueada</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <p>Su cuenta ha sido bloqueada temporalmente debido a múltiples intentos de acceso fallidos.</p>
            
            <div style="background: #ffebee; border: 1px solid #f44336; border-radius: 5px; padding: 15px; margin: 15px 0;">
                <p><strong>La cuenta se desbloqueará automáticamente el:</strong></p>
                <p style="font-size: 18px; color: #f44336;"><strong>${unlocksAt.toLocaleString('es-ES')}</strong></p>
            </div>
            
            <p>Si cree que esto es un error o necesita ayuda, contacte a nuestro equipo de soporte.</p>
        </div>
    </body>
    </html>
    `;
  }

  private getPasswordChangedTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2196F3; padding: 20px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Contraseña Actualizada</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <p>Su contraseña ha sido actualizada exitosamente.</p>
            
            <div style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
                <p><strong>Fecha del cambio:</strong> ${new Date().toLocaleString('es-ES')}</p>
            </div>
            
            <p>Si no realizó este cambio, contacte inmediatamente a nuestro equipo de soporte.</p>
        </div>
    </body>
    </html>
    `;
  }
}
