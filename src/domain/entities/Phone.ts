import { ValueObject } from '@shared/types';

/**
 * Value Object para Teléfono
 * Valida y normaliza números de teléfono
 */
export class Phone implements ValueObject {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(phone: string): Phone {
    const normalizedPhone = Phone.normalizePhone(phone);

    if (!Phone.isValidPhone(normalizedPhone)) {
      throw new Error('Formato de teléfono inválido');
    }

    return new Phone(normalizedPhone);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: ValueObject): boolean {
    return other instanceof Phone && other._value === this._value;
  }

  private static normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    return phoneRegex.test(phone);
  }

  public getFormatted(): string {
    const digits = this._value.substring(1);
    const countryCode = digits.substring(0, 2);
    const remaining = digits.substring(2);

    if (remaining.length <= 3) {
      return `+${countryCode} ${remaining}`;
    } else if (remaining.length <= 6) {
      return `+${countryCode} ${remaining.substring(0, 3)} ${remaining.substring(3)}`;
    } else {
      return `+${countryCode} ${remaining.substring(0, 3)} ${remaining.substring(3, 6)} ${remaining.substring(6)}`;
    }
  }

  public toString(): string {
    return this._value;
  }
}
