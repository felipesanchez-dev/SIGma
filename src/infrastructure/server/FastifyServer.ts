// @ts-nocheck
import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { DIContainer } from '../container/DIContainer';
import { authRoutes } from '../../interfaces/routes/authRoutes.simple';
import { errorHandler } from '../../interfaces/middlewares/errorHandler';
import { authMiddleware } from '../../interfaces/middlewares/authMiddleware';

/**
 * Configuración y creación del servidor Fastify
 * Implementa todas las configuraciones de seguridad y middleware
 */
export function createServer(container: DIContainer): FastifyInstance {
  const server = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
    trustProxy: true,
    bodyLimit: 1048576,
    caseSensitive: true,
    ignoreTrailingSlash: false,
  });

  setupSecurityPlugins(server);

  setupMiddlewares(server, container);

  setupRoutes(server, container);

  setupErrorHandling(server);

  return server;
}

async function setupSecurityPlugins(server: any): Promise<void> {
  await server.register(cors, {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('No permitido por CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });

  await server.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    keyGenerator: request => {
      return request.ip || 'unknown';
    },
    errorResponseBuilder: (req, context) => {
      return {
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas solicitudes. Intente nuevamente más tarde.',
        details: {
          limit: context.max,
          window: context.timeWindow || parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
          retryAfter: context.ttl,
        },
      };
    },
  });
}

async function setupSwagger(server: any): Promise<void> {
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'SIGma API',
        description: 'Sistema de Gestión Modular - API RESTful',
        version: '1.0.0',
        contact: {
          name: 'SIGma Development Team',
          email: 'felipe@felipesanchezdev.site',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3000}`,
          description: 'Servidor de desarrollo',
        },
      ],
      tags: [
        {
          name: 'Authentication',
          description: 'Endpoints de autenticación y registro',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Token de acceso',
          },
        },
        schemas: {
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
                description: 'Detalles adicionales del error',
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
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
  });

  await server.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
    },
    staticCSP: true,
    transformStaticCSP: header => header,
    transformSpecification: swaggerObject => {
      return swaggerObject;
    },
  });
}

function setupMiddlewares(server: any, container: DIContainer): void {
  server.decorateRequest('container', null);
  server.addHook('onRequest', async request => {
    request.container = container;
  });

  server.addHook('onRequest', async (request, reply) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      },
      'Request iniciado'
    );
  });

  server.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'Request completado'
    );
  });
}

function setupRoutes(server: any, container: DIContainer): void {
  server.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  });

  server.register(authRoutes, {
    prefix: '/api/v1/auth',
    container,
  });
}

function setupErrorHandling(server: any): void {
  server.setErrorHandler(errorHandler);

  server.setNotFoundHandler(async (request, reply) => {
    reply.status(404).send({
      status: 404,
      code: 'ROUTE_NOT_FOUND',
      message: `Ruta ${request.method} ${request.url} no encontrada`,
      details: {
        method: request.method,
        url: request.url,
      },
    });
  });
}

declare module 'fastify' {
  interface FastifyRequest {
    container: DIContainer;
  }
}
