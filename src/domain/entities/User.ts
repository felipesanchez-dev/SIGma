import { BaseEntity, TenantType, UserStatus } from '../../shared/types';
import { Email } from './Email';
import { Password } from './Password';
import { Phone } from './Phone';

/**
 * Entidad Usuario - Agregado raíz del dominio de autenticación
 */
export class User implements BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public version: number;

  private _email: Email;
  private _hashedPassword: Password;
  private _phone: Phone;
  private _name: string;
  private _country: string;
  private _city: string;
  private _tenantType: TenantType;
  private _status: UserStatus;
  private _lastLoginAt?: Date;
  private _failedLoginAttempts: number;
  private _lockedUntil?: Date;

  constructor(
    id: string,
    email: Email,
    hashedPassword: Password,
    phone: Phone,
    name: string,
    country: string,
    city: string,
    tenantType: TenantType,
    status: UserStatus = 'pending_verification',
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    version: number = 1
  ) {
    this.id = id;
    this._email = email;
    this._hashedPassword = hashedPassword;
    this._phone = phone;
    this._name = name;
    this._country = country;
    this._city = city;
    this._tenantType = tenantType;
    this._status = status;
    this._failedLoginAttempts = 0;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.version = version;
  }

  public get email(): Email {
    return this._email;
  }

  public get hashedPassword(): Password {
    return this._hashedPassword;
  }

  public get phone(): Phone {
    return this._phone;
  }

  public get name(): string {
    return this._name;
  }

  public get country(): string {
    return this._country;
  }

  public get city(): string {
    return this._city;
  }

  public get tenantType(): TenantType {
    return this._tenantType;
  }

  public get status(): UserStatus {
    return this._status;
  }

  public get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  public get failedLoginAttempts(): number {
    return this._failedLoginAttempts;
  }

  public get lockedUntil(): Date | undefined {
    return this._lockedUntil;
  }

  public verify(): void {
    if (this._status === 'pending_verification') {
      this._status = 'active';
      this.touch();
    }
  }

  public suspend(): void {
    this._status = 'suspended';
    this.touch();
  }

  public activate(): void {
    this._status = 'active';
    this._failedLoginAttempts = 0;
    delete this._lockedUntil;
    this.touch();
  }

  public markAsDeleted(): void {
    this._status = 'deleted';
    this.touch();
  }

  public recordSuccessfulLogin(): void {
    this._lastLoginAt = new Date();
    this._failedLoginAttempts = 0;
    delete this._lockedUntil;
    this.touch();
  }

  public recordFailedLogin(): void {
    this._failedLoginAttempts++;

    if (this._failedLoginAttempts >= 5) {
      this._lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }

    this.touch();
  }

  public isLocked(): boolean {
    return this._lockedUntil ? new Date() < this._lockedUntil : false;
  }

  public isActive(): boolean {
    return this._status === 'active' && !this.isLocked();
  }

  public isPendingVerification(): boolean {
    return this._status === 'pending_verification';
  }

  public updatePassword(newHashedPassword: Password): void {
    this._hashedPassword = newHashedPassword;
    this.touch();
  }

  public updateProfile(name: string, phone: Phone, country: string, city: string): void {
    this._name = name;
    this._phone = phone;
    this._country = country;
    this._city = city;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
    this.version++;
  }

  public static createProfessional(
    id: string,
    email: Email,
    hashedPassword: Password,
    phone: Phone,
    name: string,
    country: string,
    city: string
  ): User {
    return new User(id, email, hashedPassword, phone, name, country, city, 'profesional');
  }

  public static createCompany(
    id: string,
    email: Email,
    hashedPassword: Password,
    phone: Phone,
    companyName: string,
    country: string,
    city: string
  ): User {
    return new User(id, email, hashedPassword, phone, companyName, country, city, 'empresa');
  }
}
