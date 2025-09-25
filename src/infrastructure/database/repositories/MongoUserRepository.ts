import { UserRepository } from '@domain/repositories/UserRepository';
import { User } from '@domain/entities/User';
import { Email } from '@domain/entities/Email';
import { UserModel, UserDocument } from '../models/UserModel';

/**
 * Implementación MongoDB del repositorio de usuarios
 */
export class MongoUserRepository implements UserRepository {
  async findByEmail(email: Email): Promise<User | null> {
    try {
      const doc = await UserModel.findOne({ 'email.value': email.value }).select('+hashedPassword');

      if (!doc) {
        return null;
      }

      return this.toDomainEntity(doc);
    } catch (error) {
      throw new Error(
        `Error buscando usuario por email: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const doc = await UserModel.findById(id);

      if (!doc) {
        return null;
      }

      return this.toDomainEntity(doc);
    } catch (error) {
      throw new Error(
        `Error buscando usuario por ID: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async save(user: User): Promise<User> {
    try {
      const doc = this.toDocument(user);
      const savedDoc = await doc.save();
      return this.toDomainEntity(savedDoc);
    } catch (error) {
      throw new Error(
        `Error guardando usuario: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async update(user: User): Promise<User> {
    try {
      const doc = await UserModel.findByIdAndUpdate(user.id, this.toUpdateObject(user), {
        new: true,
        runValidators: true,
      }).select('+hashedPassword');

      if (!doc) {
        throw new Error('Usuario no encontrado para actualizar');
      }

      return this.toDomainEntity(doc);
    } catch (error) {
      throw new Error(
        `Error actualizando usuario: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await UserModel.findByIdAndUpdate(id, { status: 'deleted', updatedAt: new Date() });
    } catch (error) {
      throw new Error(
        `Error eliminando usuario: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async existsByEmail(email: Email): Promise<boolean> {
    try {
      const count = await UserModel.countDocuments({ 'email.value': email.value });
      return count > 0;
    } catch (error) {
      throw new Error(
        `Error verificando existencia de email: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async countActiveByTenantType(tenantType: string): Promise<number> {
    try {
      return await UserModel.countDocuments({
        tenantType,
        status: 'active',
      });
    } catch (error) {
      throw new Error(
        `Error contando usuarios activos: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findLockedUsersToUnlock(): Promise<User[]> {
    try {
      const docs = await UserModel.find({
        lockedUntil: { $lt: new Date() },
        status: 'active',
      });

      return docs.map(doc => this.toDomainEntity(doc));
    } catch (error) {
      throw new Error(
        `Error buscando usuarios bloqueados: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private toDomainEntity(doc: UserDocument): User {
    return new User(
      doc._id,
      Email.create(doc.email.value),
      doc.hashedPassword as any,
      doc.phone as any,
      doc.name,
      doc.country,
      doc.city,
      doc.tenantType,
      doc.status,
      doc.createdAt,
      doc.updatedAt,
      doc.version
    );
  }

  private toDocument(user: User): UserDocument {
    return new UserModel({
      _id: user.id,
      email: { value: user.email.value },
      hashedPassword: { value: user.hashedPassword.value },
      phone: { value: user.phone.value },
      name: user.name,
      country: user.country,
      city: user.city,
      tenantType: user.tenantType,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      version: user.version,
    });
  }

  private toUpdateObject(user: User): Record<string, unknown> {
    return {
      'email.value': user.email.value,
      'hashedPassword.value': user.hashedPassword.value,
      'phone.value': user.phone.value,
      name: user.name,
      country: user.country,
      city: user.city,
      tenantType: user.tenantType,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      updatedAt: user.updatedAt,
      version: user.version,
    };
  }
}
