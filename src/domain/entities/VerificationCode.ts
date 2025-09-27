import { BaseEntity } from '../../shared/types';
import { Email } from './Email';

/**
 * Entidad VerificationCode
 * Maneja los códigos de verificación por email
 */
export class VerificationCode implements BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public version: number;

  private _email: Email;
  private _code: string;
  private _expiresAt: Date;
  private _isUsed: boolean;
  private _attempts: number;

  constructor(
    id: string,
    email: Email,
    code: string,
    expiresAt: Date,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    version: number = 1
  ) {
    this.id = id;
    this._email = email;
    this._code = code;
    this._expiresAt = expiresAt;
    this._isUsed = false;
    this._attempts = 0;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.version = version;
  }

  public get email(): Email {
    return this._email;
  }

  public get code(): string {
    return this._code;
  }

  public get expiresAt(): Date {
    return this._expiresAt;
  }

  public get isUsed(): boolean {
    return this._isUsed;
  }

  public get attempts(): number {
    return this._attempts;
  }

  public isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  public isValid(): boolean {
    return !this._isUsed && !this.isExpired() && this._attempts < 3;
  }

  public use(): void {
    if (!this.isValid()) {
      throw new Error('Código de verificación inválido o expirado');
    }

    this._isUsed = true;
    this.touch();
  }

  public incrementAttempts(): void {
    this._attempts++;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
    this.version++;
  }

  public static create(
    id: string,
    email: Email,
    expirationTimeMs: number = 15 * 60 * 1000
  ): VerificationCode {
    const code = VerificationCode.generateCode(5);
    const expiresAt = new Date(Date.now() + expirationTimeMs);

    return new VerificationCode(id, email, code, expiresAt);
  }

  private static generateCode(length: number): string {
    const digits = '0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }

    return code;
  }
}
