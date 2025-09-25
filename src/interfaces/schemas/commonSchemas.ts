/**
 * Esquemas comunes para la documentación OpenAPI/Swagger
 */
export const commonSchemas = {
  Error: {
    type: 'object',
    required: ['status', 'code', 'message'],
    properties: {
      status: {
        type: 'integer',
        description: 'Código de estado HTTP',
      },
      code: {
        type: 'string',
        description: 'Código de error interno',
      },
      message: {
        type: 'string',
        description: 'Mensaje de error para el usuario',
      },
      details: {
        type: 'object',
        description: 'Detalles adicionales del error (opcional)',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'Timestamp del error',
      },
    },
  },

  Success: {
    type: 'object',
    required: ['success', 'message'],
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        description: 'Mensaje de éxito',
      },
      data: {
        type: 'object',
        description: 'Datos de respuesta (opcional)',
      },
    },
  },

  User: {
    type: 'object',
    required: ['id', 'email', 'name', 'tenantType', 'status'],
    properties: {
      id: {
        type: 'string',
        description: 'ID único del usuario',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email del usuario',
      },
      name: {
        type: 'string',
        description: 'Nombre completo o empresa',
      },
      phone: {
        type: 'string',
        description: 'Teléfono en formato internacional',
      },
      country: {
        type: 'string',
        description: 'País de residencia',
      },
      city: {
        type: 'string',
        description: 'Ciudad de residencia',
      },
      tenantType: {
        type: 'string',
        enum: ['professional', 'enterprise'],
        description: 'Tipo de tenant',
      },
      status: {
        type: 'string',
        enum: ['pending_verification', 'active', 'suspended'],
        description: 'Estado del usuario',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de creación',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de última actualización',
      },
    },
  },

  AuthTokens: {
    type: 'object',
    required: ['accessToken', 'refreshToken'],
    properties: {
      accessToken: {
        type: 'string',
        description: 'Token JWT de acceso (15 minutos)',
      },
      refreshToken: {
        type: 'string',
        description: 'Token de renovación (7 días)',
      },
      expiresIn: {
        type: 'integer',
        description: 'Tiempo de expiración del access token en segundos',
      },
    },
  },
};

export const securitySchemes = {
  BearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Token JWT en el header Authorization: Bearer <token>',
  },
};
