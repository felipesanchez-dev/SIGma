import 'dotenv/config';
import { createServer } from './infrastructure/server/FastifyServer';
import { MongoDatabase } from './infrastructure/database/MongoDatabase';
import { createContainer } from './infrastructure/container/DIContainer';

/**
 * Punto de entrada principal de SIGma Backend
 * Inicializa servicios, base de datos y servidor web
 */
async function bootstrap(): Promise<void> {
  try {
    console.log('Iniciando SIGma Backend');

    validateEnvironment();

    const mongoDb = MongoDatabase.getInstance();
    await mongoDb.connect(process.env.MONGODB_URI!);
    await mongoDb.createIndexes();

    const container = createContainer();

    const server = createServer(container);

    setupGracefulShutdown(server, mongoDb);

    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });

    console.log(`SIGma Backend ejecutándose en http://${host}:${port}`);
  } catch (error) {
    console.error('Error iniciando la aplicación:', error);
    process.exit(1);
  }
}

function validateEnvironment(): void {
  const required = [
    'NODE_ENV',
    'MONGODB_URI',
    'JWT_PRIVATE_KEY',
    'JWT_PUBLIC_KEY',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'AES_ENCRYPTION_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('Variables de entorno faltantes:', missing.join(', '));
    console.error('Error en .env y configura las variables');
    process.exit(1);
  }

  console.log('Variables de entorno validadas');
}

function setupGracefulShutdown(server: any, mongoDb: MongoDatabase): void {
  const gracefulShutdown = async (signal: string) => {
    console.log(`Recibida señal ${signal}, cerrando aplicación gracefully...`);

    try {
      await server.close();
      console.log('Servidor HTTP cerrado');

      await mongoDb.disconnect();
      console.log('Base de datos desconectada');

      console.log('Aplicación cerrada exitosamente');
      process.exit(0);
    } catch (error) {
      console.error('Error durante el cierre:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  process.on('uncaughtException', error => {
    console.error('Excepción no capturada:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rechazada no manejada:', reason);
    gracefulShutdown('unhandledRejection');
  });
}

// Crear instancia de servidor para exportar
let appInstance: any = null;

async function createAppInstance() {
  if (!appInstance) {
    validateEnvironment();

    const mongoDb = MongoDatabase.getInstance();
    await mongoDb.connect(process.env.MONGODB_URI!);
    await mongoDb.createIndexes();

    const container = createContainer();
    appInstance = createServer(container);
    await appInstance.ready();
  }
  return appInstance;
}

// Handler para Vercel
export default async function handler(req: any, res: any) {
  try {
    const app = await createAppInstance();
    
    // Convertir la request de Vercel a formato Fastify
    const fastifyRequest = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query
    };

    // Usar inject de Fastify para procesar la request
    const response = await app.inject(fastifyRequest);
    
    // Establecer el status code
    res.status(response.statusCode);
    
    // Establecer headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Enviar la respuesta
    res.send(response.body);
  } catch (error) {
    console.error('Error en handler de Vercel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Solo ejecutar bootstrap si no estamos en Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  bootstrap();
}
