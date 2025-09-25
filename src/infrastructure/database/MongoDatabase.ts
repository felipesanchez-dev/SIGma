import mongoose from 'mongoose';

/**
 * Configuración de conexión a MongoDB
 * Implementa las mejores prácticas de seguridad y rendimiento
 */
export class MongoDatabase {
  private static instance: MongoDatabase;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): MongoDatabase {
    if (!MongoDatabase.instance) {
      MongoDatabase.instance = new MongoDatabase();
    }
    return MongoDatabase.instance;
  }

  public async connect(uri: string): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const options: mongoose.ConnectOptions = {
        maxPoolSize: 10, // Máximo 10 conexiones concurrentes
        serverSelectionTimeoutMS: 5000, // Timeout de selección de servidor
        socketTimeoutMS: 45000, // Timeout de socket
        family: 4, // Usar IPv4

        // Configuraciones de seguridad
        retryWrites: true, // Retry en escrituras
        w: 'majority', // Write concern
        readPreference: 'primary', // Leer del primario

        // Configuraciones de rendimiento
        bufferCommands: false, // Deshabilitar buffering de comandos
      };

      await mongoose.connect(uri, options);
      this.isConnected = true;

      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB conectado exitosamente');
      });

      mongoose.connection.on('error', error => {
        console.error('❌ Error de conexión MongoDB:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB desconectado');
        this.isConnected = false;
      });

      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
      throw new Error(
        `Error de conexión a MongoDB: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('✅ MongoDB desconectado gracefully');
    } catch (error) {
      console.error('❌ Error desconectando MongoDB:', error);
    }
  }

  public getConnection(): mongoose.Connection {
    if (!this.isConnected) {
      throw new Error('MongoDB no está conectado');
    }
    return mongoose.connection;
  }

  public isReady(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async ping(): Promise<boolean> {
    try {
      if (!mongoose.connection.db) {
        return false;
      }
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Configurar índices para optimización de consultas
   */
  public async createIndexes(): Promise<void> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      await db
        .collection('users')
        .createIndex({ 'email.value': 1 }, { unique: true, background: true });
      await db.collection('users').createIndex({ status: 1 }, { background: true });
      await db.collection('users').createIndex({ tenantType: 1 }, { background: true });
      await db.collection('users').createIndex({ createdAt: 1 }, { background: true });

      await db
        .collection('verificationcodes')
        .createIndex({ 'email.value': 1, code: 1 }, { unique: true, background: true });
      await db
        .collection('verificationcodes')
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true });
      await db.collection('verificationcodes').createIndex({ isUsed: 1 }, { background: true });

      await db
        .collection('sessions')
        .createIndex({ refreshToken: 1 }, { unique: true, background: true });
      await db
        .collection('sessions')
        .createIndex({ userId: 1, deviceId: 1 }, { unique: true, background: true });
      await db.collection('sessions').createIndex({ userId: 1, status: 1 }, { background: true });
      await db
        .collection('sessions')
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true });
      await db.collection('sessions').createIndex({ lastAccessAt: 1 }, { background: true });

      console.log('✅ Índices de MongoDB creados exitosamente');
    } catch (error) {
      console.error('❌ Error creando índices:', error);
      throw error;
    }
  }

  /**
   * Limpiar datos expirados (mantenimiento)
   */
  public async cleanupExpiredData(): Promise<void> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      const now = new Date();

      const expiredCodes = await db.collection('verificationcodes').deleteMany({
        $or: [
          { expiresAt: { $lt: now } },
          { isUsed: true, updatedAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }, // Usados hace más de 24h
        ],
      });

      const expiredSessions = await db.collection('sessions').deleteMany({
        $or: [
          { expiresAt: { $lt: now } },
          {
            status: 'revoked',
            updatedAt: { $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          }, // Revocadas hace más de 7 días
        ],
      });

      console.log(
        `🧹 Limpieza completada: ${expiredCodes.deletedCount} códigos y ${expiredSessions.deletedCount} sesiones eliminadas`
      );
    } catch (error) {
      console.error('❌ Error en limpieza de datos:', error);
    }
  }
}
