import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interfaz del documento MongoDB para VerificationCode
 */
export interface IVerificationCodeDocument extends Document {
  id: string;
  email: string;
  code: string;
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema MongoDB para VerificationCode
 */
const verificationCodeSchema = new Schema<IVerificationCodeDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      length: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'verification_codes',
    versionKey: false,
  }
);

// Índices compuestos para optimizar consultas
verificationCodeSchema.index({ email: 1, isUsed: 1 });
verificationCodeSchema.index({ email: 1, code: 1 });

/**
 * Modelo MongoDB para VerificationCode
 */
export const VerificationCodeModel = mongoose.model<IVerificationCodeDocument>(
  'VerificationCode',
  verificationCodeSchema
);

export type VerificationCodeDocument = IVerificationCodeDocument;
