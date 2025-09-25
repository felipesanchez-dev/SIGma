import { PasswordService } from '@domain/services/PasswordService';
import { Password } from '@domain/entities/Password';
import * as argon2 from 'argon2';

/**
 * Implementación del servicio de contraseñas usando Argon2
 * Parámetros configurados para alta seguridad según NTC-ISO/IEC 27017
 */
export class Argon2PasswordService implements PasswordService {
  private readonly options: argon2.Options;

  constructor(
    memoryCost: number = 65536, // 64 MB
    timeCost: number = 3, // 3 iteraciones
    parallelism: number = 1 // 1 hilo
  ) {
    this.options = {
      type: argon2.argon2id, // Argon2id recomendado por OWASP
      memoryCost, // Memoria en KB
      timeCost, // Número de iteraciones
      parallelism, // Número de hilos paralelos
      hashLength: 32, // Longitud del hash en bytes
      saltLength: 16, // Longitud de la sal en bytes
    };
  }

  async hash(plainPassword: Password): Promise<Password> {
    try {
      const hashedPassword = await argon2.hash(plainPassword.value, this.options);
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
      // Si hay error en la verificación, consideramos que la contraseña es incorrecta
      return false;
    }
  }

  generateTemporaryPassword(): Password {
    // Generar contraseña temporal segura de 16 caracteres
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let tempPassword = '';

    // Asegurar al menos un carácter de cada tipo
    tempPassword += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Mayúscula
    tempPassword += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minúscula
    tempPassword += '0123456789'[Math.floor(Math.random() * 10)]; // Número
    tempPassword += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Símbolo

    // Completar con caracteres aleatorios hasta 16
    for (let i = 4; i < 16; i++) {
      tempPassword += chars[Math.floor(Math.random() * chars.length)];
    }

    // Mezclar los caracteres
    const shuffled = tempPassword
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    return Password.create(shuffled);
  }

  needsRehash(hashedPassword: Password): boolean {
    try {
      // Verificar si el hash necesita actualización por cambio en parámetros
      return argon2.needsRehash(hashedPassword.value, this.options);
    } catch (error) {
      // Si no se puede determinar, asumir que necesita rehash
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
