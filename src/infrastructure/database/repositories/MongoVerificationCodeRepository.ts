import { VerificationCodeRepository } from '../../../domain/repositories/VerificationCodeRepository';
import { VerificationCode } from '../../../domain/entities/VerificationCode';
import { Email } from '../../../domain/entities/Email';
import { Model, Document } from 'mongoose';

interface IVerificationCodeDocument extends Document {
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
 * Implementación MongoDB del repositorio de códigos de verificación
 */
export class MongoVerificationCodeRepository implements VerificationCodeRepository {
  constructor(private model: Model<IVerificationCodeDocument>) {}

  async save(verificationCode: VerificationCode): Promise<VerificationCode> {
    try {
      const doc = {
        id: verificationCode.id,
        email: verificationCode.email.value,
        code: verificationCode.code,
        expiresAt: verificationCode.expiresAt,
        isUsed: verificationCode.isUsed,
        attempts: verificationCode.attempts,
        createdAt: verificationCode.createdAt,
        updatedAt: new Date(),
      };

      const result = await this.model.findOneAndUpdate({ id: doc.id }, doc, {
        upsert: true,
        new: true,
      });

      return this.documentToEntity(result);
    } catch (error) {
      throw new Error(
        `Error guardando código de verificación: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findByEmailAndCode(email: Email, code: string): Promise<VerificationCode | null> {
    try {
      const doc = await this.model.findOne({
        email: email.value,
        code: code,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      return doc ? this.documentToEntity(doc) : null;
    } catch (error) {
      throw new Error(
        `Error buscando código de verificación: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findByCode(code: string): Promise<VerificationCode | null> {
    try {
      const doc = await this.model.findOne({
        code: code,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      return doc ? this.documentToEntity(doc) : null;
    } catch (error) {
      throw new Error(
        `Error buscando código de verificación: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findActiveByEmail(email: Email): Promise<VerificationCode[]> {
    try {
      const docs = await this.model
        .find({
          email: email.value,
          isUsed: false,
          expiresAt: { $gt: new Date() },
        })
        .sort({ createdAt: -1 });

      return docs.map(doc => this.documentToEntity(doc));
    } catch (error) {
      throw new Error(
        `Error buscando códigos activos: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async update(verificationCode: VerificationCode): Promise<VerificationCode> {
    try {
      const doc = await this.model.findOneAndUpdate(
        { id: verificationCode.id },
        {
          email: verificationCode.email.value,
          code: verificationCode.code,
          expiresAt: verificationCode.expiresAt,
          isUsed: verificationCode.isUsed,
          attempts: verificationCode.attempts,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!doc) {
        throw new Error('Código de verificación no encontrado');
      }

      return this.documentToEntity(doc);
    } catch (error) {
      throw new Error(
        `Error actualizando código de verificación: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.model.deleteOne({ id });
    } catch (error) {
      throw new Error(
        `Error eliminando código de verificación: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await this.model.deleteMany({
        $or: [{ expiresAt: { $lte: new Date() } }, { isUsed: true }],
      });
      return result.deletedCount || 0;
    } catch (error) {
      throw new Error(
        `Error eliminando códigos expirados: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async revokeAllByEmail(email: Email): Promise<void> {
    try {
      await this.model.updateMany(
        { email: email.value, isUsed: false },
        { isUsed: true, updatedAt: new Date() }
      );
    } catch (error) {
      throw new Error(
        `Error revocando códigos: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private documentToEntity(doc: IVerificationCodeDocument): VerificationCode {
    const email = Email.create(doc.email);
    return new VerificationCode(
      doc.id,
      email,
      doc.code,
      doc.expiresAt,
      doc.createdAt,
      doc.updatedAt || doc.createdAt,
      1
    );
  }
}
