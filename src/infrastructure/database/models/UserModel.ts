import { Schema, model, Document } from 'mongoose';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/entities/Email';
import { Password } from '../../../domain/entities/Password';
import { Phone } from '../../../domain/entities/Phone';
import { TenantType, UserStatus } from '../../../shared/types';

/**
 * Esquema de MongoDB para la entidad User
 * Implementa las mejores prácticas de seguridad y rendimiento
 */

export interface UserDocument extends Document {
  _id: string;
  email: {
    value: string;
  };
  hashedPassword: {
    value: string;
  };
  phone: {
    value: string;
  };
  name: string;
  country: string;
  city: string;
  tenantType: TenantType;
  status: UserStatus;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

const EmailSchema = new Schema(
  {
    value: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
      validate: {
        validator: (email: string): boolean => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: 'Formato de email inválido',
      },
    },
  },
  { _id: false }
);

const PasswordSchema = new Schema(
  {
    value: {
      type: String,
      required: true,
      minlength: 60,
    },
  },
  { _id: false }
);

const PhoneSchema = new Schema(
  {
    value: {
      type: String,
      required: true,
      validate: {
        validator: (phone: string): boolean => {
          const phoneRegex = /^\+[1-9]\d{7,14}$/;
          return phoneRegex.test(phone);
        },
        message: 'Formato de teléfono inválido',
      },
    },
  },
  { _id: false }
);

const UserSchema = new Schema<UserDocument>(
  {
    _id: {
      type: String,
      required: true,
    },
    email: {
      type: EmailSchema,
      required: true,
      unique: true,
      index: true,
    },
    hashedPassword: {
      type: PasswordSchema,
      required: true,
      select: false,
    },
    phone: {
      type: PhoneSchema,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      minlength: 2,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      minlength: 2,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      minlength: 2,
    },
    tenantType: {
      type: String,
      required: true,
      enum: ['profesional', 'empresa'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending_verification', 'active', 'suspended', 'deleted'],
      default: 'pending_verification',
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 10,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: 'users',
    versionKey: false,
  }
);

UserSchema.index({ status: 1, tenantType: 1 });
UserSchema.index({ createdAt: 1 });
UserSchema.index({ lastLoginAt: 1 });
UserSchema.index({ lockedUntil: 1 }, { sparse: true });

UserSchema.statics.fromDomainEntity = function (user: User): UserDocument {
  return new this({
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
};

UserSchema.statics.toDomainEntity = function (doc: UserDocument): User {
  return new User(
    doc._id,
    Email.create(doc.email.value),
    Password.createFromHash(doc.hashedPassword.value),
    Phone.create(doc.phone.value),
    doc.name,
    doc.country,
    doc.city,
    doc.tenantType,
    doc.status,
    doc.createdAt,
    doc.updatedAt,
    doc.version
  );
};

UserSchema.pre('save', function (next) {
  if (!this.isNew) {
    this.version++;
  }

  if (!this.isNew && this.isModified('email')) {
    return next(new Error('El email no puede ser modificado'));
  }

  next();
});

UserSchema.post('save', function (doc) {
  console.log(`Usuario ${doc._id} ${this.isNew ? 'creado' : 'actualizado'}`);
});

export const UserModel = model<UserDocument>('User', UserSchema);
