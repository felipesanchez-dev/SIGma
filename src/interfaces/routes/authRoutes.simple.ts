// @ts-nocheck
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DIContainer } from '@infrastructure/container/DIContainer';
import { authController } from '../controllers/authController';

/**
 * Rutas de autenticación simplificadas para SIGma
 */
export async function authRoutes(fastify: FastifyInstance, options: any): Promise<void> {
  const { container } = options;

  // POST /register - Registrar nuevo usuario
  fastify.post('/register', async (request, reply) => {
    return authController.register(request, reply, container);
  });

  // POST /verify - Verificar código de email
  fastify.post('/verify', async (request, reply) => {
    return authController.verify(request, reply, container);
  });

  // POST /login - Iniciar sesión
  fastify.post('/login', async (request, reply) => {
    return authController.login(request, reply, container);
  });

  // POST /refresh - Renovar token de acceso
  fastify.post('/refresh', async (request, reply) => {
    return authController.refresh(request, reply, container);
  });

  // POST /logout - Cerrar sesión
  fastify.post('/logout', async (request, reply) => {
    return authController.logout(request, reply, container);
  });

  // GET /me - Obtener información del usuario actual
  fastify.get('/me', async (request, reply) => {
    return authController.getCurrentUser(request, reply, container);
  });
}

// Declarar el plugin con opciones
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
}
