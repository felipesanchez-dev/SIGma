import { ValueObject, PasswordPolicy } from '@shared/types';
import { InvalidPasswordError } from '@shared/errors';

/**
 * Value Object para Password
 * Valida y encapsula las reglas de contraseña
 */
export class Password implements ValueObject {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(password: string, policy?: PasswordPolicy): Password {
    const defaultPolicy: PasswordPolicy = {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
    };

    const activePolicy = policy || defaultPolicy;

    Password.validatePassword(password, activePolicy);
    return new Password(password);
  }

  public static createFromHash(hashedPassword: string): Password {
    return new Password(hashedPassword);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: ValueObject): boolean {
    return other instanceof Password && other._value === this._value;
  }

  private static validatePassword(password: string, policy: PasswordPolicy): void {
    if (password.length < policy.minLength) {
      throw new InvalidPasswordError(`debe tener al menos ${policy.minLength} caracteres`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      throw new InvalidPasswordError('debe contener al menos una letra mayúscula');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      throw new InvalidPasswordError('debe contener al menos una letra minúscula');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      throw new InvalidPasswordError('debe contener al menos un número');
    }

    if (policy.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new InvalidPasswordError('debe contener al menos un símbolo especial');
    }

    if (/\s/.test(password)) {
      throw new InvalidPasswordError('no debe contener espacios en blanco');
    }

    if (Password.isCommonPassword(password)) {
      throw new InvalidPasswordError('es demasiado común, elija una más segura');
    }
  }

  private static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      '123456789012',
      'password1234',
      'qwerty123456',
      'admin1234567',
      'letmein12345',
      'welcome12345',
      'monkey123456',
      'dragon123456',
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  public toString(): string {
    return '[PROTECTED]';
  }
}
