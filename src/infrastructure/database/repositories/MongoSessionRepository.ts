import { SessionRepository } from '@domain/repositories/SessionRepository';
import { Session, DeviceMeta } from '@domain/entities/Session';
import { Model, Document } from 'mongoose';

interface ISessionDocument extends Document {
  id: string;
  userId: string;
  deviceId: string;
  deviceMeta: DeviceMeta;
  status: 'active' | 'expired' | 'revoked';
  expiresAt: Date;
  refreshToken: string;
  lastAccessAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Implementación MongoDB del repositorio de sesiones
 */
export class MongoSessionRepository implements SessionRepository {
  constructor(private model: Model<ISessionDocument>) {}

  async save(session: Session): Promise<Session> {
    try {
      const doc = {
        id: session.id,
        userId: session.userId,
        deviceId: session.deviceId,
        deviceMeta: session.deviceMeta,
        status: session.status,
        expiresAt: session.expiresAt,
        refreshToken: session.refreshToken,
        lastAccessAt: session.lastAccessAt,
        createdAt: session.createdAt,
        updatedAt: new Date(),
      };

      const result = await this.model.findOneAndUpdate({ id: doc.id }, doc, {
        upsert: true,
        new: true,
      });

      return this.documentToEntity(result);
    } catch (error) {
      throw new Error(
        `Error guardando sesión: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findById(id: string): Promise<Session | null> {
    try {
      const doc = await this.model.findOne({ id });
      return doc ? this.documentToEntity(doc) : null;
    } catch (error) {
      throw new Error(
        `Error buscando sesión: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    try {
      const doc = await this.model.findOne({
        refreshToken,
        status: 'active',
        expiresAt: { $gt: new Date() },
      });
      return doc ? this.documentToEntity(doc) : null;
    } catch (error) {
      throw new Error(
        `Error buscando sesión por token: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    try {
      const docs = await this.model
        .find({
          userId,
          status: 'active',
          expiresAt: { $gt: new Date() },
        })
        .sort({ lastAccessAt: -1 });

      return docs.map(doc => this.documentToEntity(doc));
    } catch (error) {
      throw new Error(
        `Error buscando sesiones activas: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<Session | null> {
    try {
      const doc = await this.model.findOne({
        userId,
        deviceId,
        status: 'active',
        expiresAt: { $gt: new Date() },
      });
      return doc ? this.documentToEntity(doc) : null;
    } catch (error) {
      throw new Error(
        `Error buscando sesión por usuario y dispositivo: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async update(session: Session): Promise<Session> {
    try {
      const doc = await this.model.findOneAndUpdate(
        { id: session.id },
        {
          userId: session.userId,
          deviceId: session.deviceId,
          deviceMeta: session.deviceMeta,
          status: session.status,
          expiresAt: session.expiresAt,
          refreshToken: session.refreshToken,
          lastAccessAt: session.lastAccessAt,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!doc) {
        throw new Error('Sesión no encontrada');
      }

      return this.documentToEntity(doc);
    } catch (error) {
      throw new Error(
        `Error actualizando sesión: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.model.deleteOne({ id });
    } catch (error) {
      throw new Error(
        `Error eliminando sesión: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    try {
      await this.model.updateMany(
        { userId, status: 'active' },
        { status: 'revoked', updatedAt: new Date() }
      );
    } catch (error) {
      throw new Error(
        `Error revocando sesiones: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async revokeOldestSessions(userId: string, maxSessions: number): Promise<void> {
    try {
      const sessions = await this.model
        .find({
          userId,
          status: 'active',
          expiresAt: { $gt: new Date() },
        })
        .sort({ lastAccessAt: 1 })
        .skip(maxSessions);

      if (sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        await this.model.updateMany(
          { id: { $in: sessionIds } },
          { status: 'revoked', updatedAt: new Date() }
        );
      }
    } catch (error) {
      throw new Error(
        `Error revocando sesiones antiguas: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async countActiveByUserId(userId: string): Promise<number> {
    try {
      return await this.model.countDocuments({
        userId,
        status: 'active',
        expiresAt: { $gt: new Date() },
      });
    } catch (error) {
      throw new Error(
        `Error contando sesiones activas: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await this.model.deleteMany({
        $or: [{ expiresAt: { $lte: new Date() } }, { status: { $in: ['expired', 'revoked'] } }],
      });
      return result.deletedCount || 0;
    } catch (error) {
      throw new Error(
        `Error eliminando sesiones expiradas: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findExpiringSessionsInNext(minutes: number): Promise<Session[]> {
    try {
      const expirationTime = new Date(Date.now() + minutes * 60 * 1000);
      const docs = await this.model.find({
        status: 'active',
        expiresAt: { $lte: expirationTime, $gt: new Date() },
      });

      return docs.map(doc => this.documentToEntity(doc));
    } catch (error) {
      throw new Error(
        `Error buscando sesiones próximas a expirar: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private documentToEntity(doc: ISessionDocument): Session {
    return new Session(
      doc.id,
      doc.userId,
      doc.deviceId,
      doc.deviceMeta,
      doc.refreshToken,
      doc.expiresAt,
      doc.createdAt,
      doc.updatedAt || doc.createdAt,
      1
    );
  }
}
