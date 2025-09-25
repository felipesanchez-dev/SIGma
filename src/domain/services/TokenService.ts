/**
 * Servicio de dominio para el manejo de tokens JWT
 */
export interface TokenService {
  /**
   * Generar token de acceso
   */
  generateAccessToken(userId: string, sessionId: string): Promise<string>;

  /**
   * Generar token de refresco
   */
  generateRefreshToken(): string;

  /**
   * Verificar y decodificar token de acceso
   */
  verifyAccessToken(token: string): Promise<TokenPayload>;

  /**
   * Verificar token de refresco
   */
  verifyRefreshToken(token: string): boolean;

  /**
   * Extraer información del token sin verificar (para logging)
   */
  decodeToken(token: string): TokenPayload | null;

  /**
   * Obtener tiempo de expiración restante del token
   */
  getTokenExpirationTime(token: string): number | null;
}

export interface TokenPayload {
  userId: string;
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}