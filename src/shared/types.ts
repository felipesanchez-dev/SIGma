/**
 * Tipos básicos y enums para el dominio de SIGma
 */

export type TenantType = 'profesional' | 'empresa';

export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'deleted';

export type SessionStatus = 'active' | 'expired' | 'revoked';

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  version: number;
  occurredAt: Date;
  data: Record<string, unknown>;
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ValueObject {
  equals(other: ValueObject): boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
}

export interface VerificationCodeConfig {
  length: number;
  expirationTimeMs: number;
}

export interface SessionConfig {
  maxConcurrentSessions: number;
  cleanupIntervalMs: number;
}
