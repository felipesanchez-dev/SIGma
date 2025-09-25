import { PasswordService } from '@domain/services/PasswordService';
import { Password } from '@domain/entities/Password';
import * as argon2 from 'argon2';

/**
 * Implementación del servicio de contraseñas usando Argon2
 * Parámetros configurados para alta seguridad según NTC-ISO/IEC 27017
 */
export class Argon2PasswordService implements PasswordService {
  private readonly options: argon2.Options;

  constructor(memoryCost: number = 65536, timeCost: number = 3, parallelism: number = 1) {
    this.options = {
      type: argon2.argon2id,
      memoryCost,
      timeCost,
      parallelism,
      hashLength: 32,
      saltLength: 16,
    };
  }

  async hash(plainPassword: Password): Promise<Password> {
    try {
      const hashedPassword = await argon2.hash(plainPassword.value);
      return Password.createFromHash(hashedPassword);
    } catch (error) {
      throw new Error(
        `Error al hashear la contraseña: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async verify(plainPassword: Password, hashedPassword: Password): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword.value, plainPassword.value);
    } catch (error) {
      return false;
    }
  }

  generateTemporaryPassword(): Password {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let tempPassword = '';

    tempPassword += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    tempPassword += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    tempPassword += '0123456789'[Math.floor(Math.random() * 10)];
    tempPassword += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    for (let i = 4; i < 16; i++) {
      tempPassword += chars[Math.floor(Math.random() * chars.length)];
    }

    const shuffled = tempPassword
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    return Password.create(shuffled);
  }

  needsRehash(hashedPassword: Password): boolean {
    try {
      return argon2.needsRehash(hashedPassword.value, this.options);
    } catch (error) {
      return true;
    }
  }

  /**
   * Obtener configuración actual de Argon2 para auditoría
   */
  getSecurityConfiguration(): Record<string, unknown> {
    return {
      algorithm: 'Argon2id',
      memoryCost: this.options.memoryCost,
      timeCost: this.options.timeCost,
      parallelism: this.options.parallelism,
      hashLength: this.options.hashLength,
      saltLength: this.options.saltLength,
      securityLevel: 'High (NTC-ISO/IEC 27017 compliant)',
    };
  }
}
