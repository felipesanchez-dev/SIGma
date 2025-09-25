import { ApiError } from './types';

/**
 * Errores específicos del dominio de SIGma
 */

export class DomainError extends Error implements ApiError {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainError';
    this.status = status;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super(401, 'AUTH_INVALID_CREDENTIALS', 'Credenciales inválidas');
  }
}

export class UserNotFoundError extends DomainError {
  constructor(email?: string) {
    super(404, 'USER_NOT_FOUND', 'Usuario no encontrado', { email });
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(409, 'USER_ALREADY_EXISTS', 'El usuario ya existe', { email });
  }
}

export class UserNotVerifiedError extends DomainError {
  constructor() {
    super(403, 'USER_NOT_VERIFIED', 'Usuario no verificado');
  }
}

export class MaxSessionsExceededError extends DomainError {
  constructor(maxSessions: number) {
    super(
      429,
      'MAX_SESSIONS_EXCEEDED',
      `Máximo de ${maxSessions} sesiones concurrentes alcanzado`,
      { maxSessions }
    );
  }
}

export class InvalidPasswordError extends DomainError {
  constructor(reason: string) {
    super(400, 'INVALID_PASSWORD', `Contraseña inválida: ${reason}`);
  }
}

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(400, 'INVALID_EMAIL', 'Formato de email inválido', { email });
  }
}

export class InvalidTenantTypeError extends DomainError {
  constructor(tenantType: string) {
    super(400, 'INVALID_TENANT_TYPE', 'Tipo de tenant inválido', { tenantType });
  }
}

export class VerificationCodeExpiredError extends DomainError {
  constructor() {
    super(410, 'VERIFICATION_CODE_EXPIRED', 'Código de verificación expirado');
  }
}

export class InvalidVerificationCodeError extends DomainError {
  constructor() {
    super(400, 'INVALID_VERIFICATION_CODE', 'Código de verificación inválido');
  }
}

export class VerificationCodeNotFoundError extends DomainError {
  constructor() {
    super(404, 'VERIFICATION_CODE_NOT_FOUND', 'Código de verificación no encontrado');
  }
}

export class TokenExpiredError extends DomainError {
  constructor() {
    super(401, 'TOKEN_EXPIRED', 'Token expirado');
  }
}

export class InvalidTokenError extends DomainError {
  constructor() {
    super(401, 'INVALID_TOKEN', 'Token inválido');
  }
}

export class TokenNotFoundError extends DomainError {
  constructor() {
    super(401, 'TOKEN_NOT_FOUND', 'Token no encontrado');
  }
}

export class SessionNotFoundError extends DomainError {
  constructor() {
    super(404, 'SESSION_NOT_FOUND', 'Sesión no encontrada');
  }
}

export class SessionExpiredError extends DomainError {
  constructor() {
    super(401, 'SESSION_EXPIRED', 'Sesión expirada');
  }
}
