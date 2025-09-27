import { ValueObject } from '../../shared/types';
import { InvalidEmailError } from '../../shared/errors';

/**
 * Value Object para Email
 * Valida y encapsula la lógica del email
 */
export class Email implements ValueObject {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(email: string): Email {
    if (!Email.isValidEmail(email)) {
      throw new InvalidEmailError(email);
    }
    return new Email(email.toLowerCase().trim());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: ValueObject): boolean {
    return other instanceof Email && other._value === this._value;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 320;
  }

  public toString(): string {
    return this._value;
  }
}
