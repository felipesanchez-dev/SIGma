import { BaseEntity, SessionStatus } from '../../shared/types';

/**
 * Entidad Session
 * Maneja las sesiones de usuario y control de concurrencia
 */
export class Session implements BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public version: number;

  private _userId: string;
  private _deviceId: string;
  private _deviceMeta: DeviceMeta;
  private _status: SessionStatus;
  private _expiresAt: Date;
  private _refreshToken: string;
  private _lastAccessAt: Date;

  constructor(
    id: string,
    userId: string,
    deviceId: string,
    deviceMeta: DeviceMeta,
    refreshToken: string,
    expiresAt: Date,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    version: number = 1
  ) {
    this.id = id;
    this._userId = userId;
    this._deviceId = deviceId;
    this._deviceMeta = deviceMeta;
    this._status = 'active';
    this._refreshToken = refreshToken;
    this._expiresAt = expiresAt;
    this._lastAccessAt = new Date();
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.version = version;
  }

  public get userId(): string {
    return this._userId;
  }

  public get deviceId(): string {
    return this._deviceId;
  }

  public get deviceMeta(): DeviceMeta {
    return this._deviceMeta;
  }

  public get status(): SessionStatus {
    return this._status;
  }

  public get expiresAt(): Date {
    return this._expiresAt;
  }

  public get refreshToken(): string {
    return this._refreshToken;
  }

  public get lastAccessAt(): Date {
    return this._lastAccessAt;
  }

  public isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  public isActive(): boolean {
    return this._status === 'active' && !this.isExpired();
  }

  public revoke(): void {
    this._status = 'revoked';
    this.touch();
  }

  public markAsExpired(): void {
    this._status = 'expired';
    this.touch();
  }

  public updateLastAccess(): void {
    this._lastAccessAt = new Date();
    this.touch();
  }

  public updateRefreshToken(newRefreshToken: string, newExpiresAt: Date): void {
    this._refreshToken = newRefreshToken;
    this._expiresAt = newExpiresAt;
    this.updateLastAccess();
  }

  private touch(): void {
    this.updatedAt = new Date();
    this.version++;
  }
}

export interface DeviceMeta {
  userAgent: string;
  ipAddress: string;
  platform?: string;
  browser?: string;
  os?: string;
}
