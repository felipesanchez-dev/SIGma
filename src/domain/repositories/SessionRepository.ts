import { Session } from '@domain/entities/Session';

/**
 * Repositorio para la entidad Session
 */
export interface SessionRepository {
  /**
   * Guardar nueva sesión
   */
  save(session: Session): Promise<Session>;

  /**
   * Buscar sesión por ID
   */
  findById(id: string): Promise<Session | null>;

  /**
   * Buscar sesión por refresh token
   */
  findByRefreshToken(refreshToken: string): Promise<Session | null>;

  /**
   * Buscar sesiones activas por usuario
   */
  findActiveByUserId(userId: string): Promise<Session[]>;

  /**
   * Buscar sesión por usuario y dispositivo
   */
  findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<Session | null>;

  /**
   * Actualizar sesión
   */
  update(session: Session): Promise<Session>;

  /**
   * Eliminar sesión
   */
  delete(id: string): Promise<void>;

  /**
   * Revocar todas las sesiones de un usuario
   */
  revokeAllByUserId(userId: string): Promise<void>;

  /**
   * Revocar sesiones más antiguas para un usuario (mantener solo las N más recientes)
   */
  revokeOldestSessions(userId: string, maxSessions: number): Promise<void>;

  /**
   * Contar sesiones activas por usuario
   */
  countActiveByUserId(userId: string): Promise<number>;

  /**
   * Eliminar sesiones expiradas
   */
  deleteExpired(): Promise<number>;

  /**
   * Encontrar sesiones por expirar (para notificaciones)
   */
  findExpiringSessionsInNext(minutes: number): Promise<Session[]>;
}