import { TokenService, TokenPayload } from '../../domain/services/TokenService';
import { TokenExpiredError, InvalidTokenError } from '../../shared/errors';
import * as jwt from 'jsonwebtoken';

/**
 * Implementación del servicio de tokens usando JWT con RS256
 * Utiliza claves asimétricas para máxima seguridad
 */
export class JwtTokenService implements TokenService {
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly algorithm: jwt.Algorithm = 'RS256';
  private readonly issuer: string;
  private readonly audience: string;
  private readonly accessTokenExpiresIn: string;

  constructor(
    privateKey: string,
    publicKey: string,
    issuer: string = 'SIGma-System',
    audience: string = 'SIGma-Users',
    accessTokenExpiresIn: string = '15m'
  ) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.issuer = issuer;
    this.audience = audience;
    this.accessTokenExpiresIn = accessTokenExpiresIn;
  }

  async generateAccessToken(userId: string, sessionId: string): Promise<string> {
    try {
      const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
        userId,
        sessionId,
        iss: this.issuer,
        aud: this.audience,
      };

      // @ts-ignore - Temporal fix for JWT types
      return jwt.sign(payload, this.privateKey, {
        algorithm: 'RS256',
        expiresIn: this.accessTokenExpiresIn,
        issuer: this.issuer,
        audience: this.audience,
        subject: userId,
        jwtid: this.generateJTI(),
      });
    } catch (error) {
      throw new Error(
        `Error generando access token: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  generateRefreshToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';

    for (let i = 0; i < 64; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }

    return token;
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.issuer,
        audience: this.audience,
      }) as jwt.JwtPayload;

      return {
        userId: decoded.sub || decoded.userId,
        sessionId: decoded.sessionId,
        iat: decoded.iat || 0,
        exp: decoded.exp || 0,
        iss: decoded.iss || '',
        aud: Array.isArray(decoded.aud) ? decoded.aud[0] || '' : decoded.aud || '',
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenError();
      }
      throw new InvalidTokenError();
    }
  }

  verifyRefreshToken(token: string): boolean {
    const refreshTokenRegex = /^[A-Za-z0-9]{64}$/;
    return refreshTokenRegex.test(token);
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      if (!decoded) return null;

      return {
        userId: decoded.sub || decoded.userId,
        sessionId: decoded.sessionId,
        iat: decoded.iat || 0,
        exp: decoded.exp || 0,
        iss: decoded.iss || '',
        aud: Array.isArray(decoded.aud) ? decoded.aud[0] || '' : decoded.aud || '',
      };
    } catch (error) {
      return null;
    }
  }

  getTokenExpirationTime(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return null;

      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, decoded.exp - now);
    } catch (error) {
      return null;
    }
  }

  private generateJTI(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Obtener información de configuración para auditoría
   */
  getSecurityConfiguration(): Record<string, unknown> {
    return {
      algorithm: this.algorithm,
      issuer: this.issuer,
      audience: this.audience,
      accessTokenExpiry: this.accessTokenExpiresIn,
      keyType: 'RSA Asymmetric Keys',
      securityLevel: 'High (RS256 with 2048-bit keys)',
    };
  }

  /**
   * Validar configuración de claves
   */
  validateKeys(): boolean {
    try {
      const testToken = jwt.sign({ test: true }, this.privateKey, {
        algorithm: this.algorithm,
        expiresIn: '1s',
      });

      jwt.verify(testToken, this.publicKey, {
        algorithms: [this.algorithm],
      });

      return true;
    } catch (error) {
      return false;
    }
  }
}
