import { User } from '../../domain/entities/User';
import { Email } from '../../domain/entities/Email';

/**
 * Repositorio para la entidad User
 * Define los contratos de persistencia
 */
export interface UserRepository {
  /**
   * Buscar usuario por email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Buscar usuario por ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Guardar nuevo usuario
   */
  save(user: User): Promise<User>;

  /**
   * Actualizar usuario existente
   */
  update(user: User): Promise<User>;

  /**
   * Eliminar usuario (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Verificar si existe un usuario con el email dado
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Contar usuarios activos por tipo de tenant
   */
  countActiveByTenantType(tenantType: string): Promise<number>;

  /**
   * Encontrar usuarios bloqueados que puedan ser desbloqueados
   */
  findLockedUsersToUnlock(): Promise<User[]>;
}