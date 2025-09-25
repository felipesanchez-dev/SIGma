import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interfaz del dispositivo
 */
interface IDeviceMeta {
  userAgent: string;
  ipAddress: string;
  platform?: string;
  browser?: string;
  os?: string;
}

/**
 * Interfaz del documento MongoDB para Session
 */
export interface ISessionDocument extends Document {
  id: string;
  userId: string;
  deviceId: string;
  deviceMeta: IDeviceMeta;
  status: 'active' | 'expired' | 'revoked';
  expiresAt: Date;
  refreshToken: string;
  lastAccessAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema para DeviceMeta
 */
const deviceMetaSchema = new Schema<IDeviceMeta>(
  {
    userAgent: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      required: false,
    },
    browser: {
      type: String,
      required: false,
    },
    os: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

/**
 * Schema MongoDB para Session
 */
const sessionSchema = new Schema<ISessionDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    deviceMeta: {
      type: deviceMetaSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked'],
      default: 'active',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lastAccessAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'sessions',
    versionKey: false,
  }
);

// Índices compuestos para optimizar consultas
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ userId: 1, deviceId: 1 });
sessionSchema.index({ refreshToken: 1, status: 1 });

/**
 * Modelo MongoDB para Session
 */
export const SessionModel = mongoose.model<ISessionDocument>('Session', sessionSchema);

export type SessionDocument = ISessionDocument;
export type DeviceMeta = IDeviceMeta;
