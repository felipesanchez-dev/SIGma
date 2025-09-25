// @ts-nocheck
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DIContainer } from '@infrastructure/container/DIContainer';
import { authController } from '../controllers/authController';

/**
 * Rutas de autenticación para SIGma
 */
export async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & { container: DIContainer }
): Promise<void> {
  const { container } = options;

  fastify.post(
    '/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'phone', 'name', 'country', 'city', 'password', 'tenantType'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario',
            },
            phone: {
              type: 'string',
              pattern: '^\\+[1-9]\\d{7,14}$',
              description: 'Teléfono en formato internacional (+1234567890)',
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Nombre completo o nombre de la empresa',
            },
            country: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'País de residencia',
            },
            city: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Ciudad de residencia',
            },
            password: {
              type: 'string',
              minLength: 12,
              description:
                'Contraseña (mín. 12 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo)',
            },
            tenantType: {
              type: 'string',
              enum: ['profesional', 'empresa'],
              description: 'Tipo de cuenta',
            },
          },
        },
        response: {
          202: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              userId: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              status: { type: 'integer' },
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
          409: {
            type: 'object',
            properties: {
              status: { type: 'integer' },
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    (request, reply) => authController.register(request, reply, container)
  );

  fastify.post(
    '/verify',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Verificar código de email',
        description: 'Verifica el código enviado por email y activa la cuenta',
        body: {
          type: 'object',
          required: ['code'],
          properties: {
            code: {
              type: 'string',
              pattern: '^\\d{5}$',
              description: 'Código de verificación de 5 dígitos',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              userId: { type: 'string' },
            },
          },
          400: { $ref: '#/components/schemas/Error' },
          404: { $ref: '#/components/schemas/Error' },
          410: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    (request, reply) => authController.verify(request, reply, container)
  );

  fastify.post(
    '/login',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Iniciar sesión',
        description: 'Autentica usuario y devuelve tokens de acceso',
        body: {
          type: 'object',
          required: ['email', 'password', 'deviceId', 'deviceMeta'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario',
            },
            password: {
              type: 'string',
              description: 'Contraseña del usuario',
            },
            deviceId: {
              type: 'string',
              description: 'Identificador único del dispositivo',
            },
            deviceMeta: {
              type: 'object',
              required: ['userAgent', 'ipAddress'],
              properties: {
                userAgent: { type: 'string' },
                ipAddress: { type: 'string' },
                platform: { type: 'string' },
                browser: { type: 'string' },
                os: { type: 'string' },
              },
              description: 'Metadatos del dispositivo',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              expiresIn: { type: 'number' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  tenantType: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
          401: { $ref: '#/components/schemas/Error' },
          403: { $ref: '#/components/schemas/Error' },
          423: { $ref: '#/components/schemas/Error' },
          429: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    (request, reply) => authController.login(request, reply, container)
  );

  fastify.post(
    '/refresh',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Renovar token de acceso',
        description: 'Renueva el token de acceso usando el refresh token',
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Token de refresco',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              accessToken: { type: 'string' },
              expiresIn: { type: 'number' },
            },
          },
          401: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    (request, reply) => authController.refresh(request, reply, container)
  );

  fastify.post(
    '/logout',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Cerrar sesión',
        description: 'Cierra la sesión actual del usuario',
        body: {
          type: 'object',
          properties: {
            refreshToken: { type: 'string' },
            deviceId: { type: 'string' },
            userId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          404: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    (request, reply) => authController.logout(request, reply, container)
  );

  fastify.post(
    '/logout-all',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Cerrar todas las sesiones',
        description: 'Cierra todas las sesiones activas del usuario',
        security: [{ BearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          401: { $ref: '#/components/schemas/Error' },
        },
      },
      preHandler: async (request, reply) => {
        const { authMiddleware } = await import('../middlewares/authMiddleware');
        await authMiddleware(request, reply);
      },
    },
    (request, reply) => authController.logoutAll(request, reply, container)
  );
}
