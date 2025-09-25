import { Password } from '@domain/entities/Password';

/**
 * Servicio de dominio para el manejo de contraseñas
 * Encapsula la lógica de hashing y verificación
 */
export interface PasswordService {
  /**
   * Hashear una contraseña plana
   */
  hash(plainPassword: Password): Promise<Password>;

  /**
   * Verificar una contraseña plana contra un hash
   */
  verify(plainPassword: Password, hashedPassword: Password): Promise<boolean>;

  /**
   * Generar una contraseña temporal segura
   */
  generateTemporaryPassword(): Password;

  /**
   * Verificar si una contraseña necesita ser re-hasheada
   * (por cambios en parámetros de seguridad)
   */
  needsRehash(hashedPassword: Password): boolean;
}