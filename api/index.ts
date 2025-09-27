import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../src/infrastructure/server/FastifyServer';
import { MongoDatabase } from '../src/infrastructure/database/MongoDatabase';
import { createContainer } from '../src/infrastructure/container/DIContainer';

// Forzar que Vercel reconozca este como el punto de entrada
export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  }
};

/**
 * Instancia global del servidor para reutilizar conexiones
 */
let app: any = null;
let isConnected = false;

/**
 * Validar variables de entorno requeridas
 */
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
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }
}

/**
 * Inicializar la aplicación para Vercel
 */
async function initializeApp() {
  if (app && isConnected) {
    return app;
  }

  try {
    console.log('Inicializando SIGma Backend para Vercel...');
    
    // Validar entorno
    validateEnvironment();

    // Conectar a MongoDB
    if (!isConnected) {
      const mongoDb = MongoDatabase.getInstance();
      await mongoDb.connect(process.env.MONGODB_URI!);
      await mongoDb.createIndexes();
      isConnected = true;
      console.log('MongoDB conectado exitosamente');
    }

    // Crear contenedor de dependencias
    const container = createContainer();

    // Crear servidor Fastify
    app = createServer(container);
    await app.ready();
    
    console.log('SIGma Backend inicializado para Vercel');
    return app;
  } catch (error) {
    console.error('Error inicializando aplicación:', error);
    throw error;
  }
}

/**
 * Handler principal para Vercel
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Configurar CORS headers
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin || '')) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');

    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Endpoint de health check optimizado
    if (req.url === '/health' || req.url === '/api/health') {
      return res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.2',
        uptime: process.uptime()
      });
    }

    // Inicializar la aplicación
    const fastifyApp = await initializeApp();

    // Preparar la request para Fastify
    const url = req.url || '/';
    const method = req.method || 'GET';
    
    // Crear la request en formato Fastify
    const fastifyRequest = {
      method: method as any,
      url: url,
      headers: req.headers,
      payload: req.body,
      query: req.query
    };

    // Procesar la request usando Fastify inject
    const response = await fastifyApp.inject(fastifyRequest);
    
    // Establecer status code
    res.status(response.statusCode);
    
    // Establecer headers de respuesta (evitar duplicar CORS)
    const headers = response.headers;
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && !key.toLowerCase().startsWith('access-control')) {
        res.setHeader(key, Array.isArray(value) ? value.join(', ') : String(value));
      }
    }
    
    // Enviar la respuesta
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      try {
        const jsonBody = JSON.parse(response.body);
        return res.json(jsonBody);
      } catch {
        return res.send(response.body);
      }
    } else {
      return res.send(response.body);
    }
    
  } catch (error) {
    console.error('Error en handler de Vercel:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    if (process.env.NODE_ENV !== 'production') {
      console.error('Stack trace:', errorStack);
    }
    
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}

// Manejar el cierre graceful para limpiar recursos
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, cerrando aplicación...');
  if (isConnected) {
    try {
      const mongoDb = MongoDatabase.getInstance();
      await mongoDb.disconnect();
      console.log('MongoDB desconectado');
    } catch (error) {
      console.error('Error desconectando MongoDB:', error);
    }
  }
});
