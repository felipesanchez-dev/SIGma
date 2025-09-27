import 'dotenv/config';
import { createServer } from '../src/infrastructure/server/FastifyServer';
import { MongoDatabase } from '../src/infrastructure/database/MongoDatabase';
import { createContainer } from '../src/infrastructure/container/DIContainer';

// Cache de la instancia de la app para reutilizar en requests posteriores
let cachedApp: any = null;

export async function createAppInstance() {
  if (!cachedApp) {
    // Validar variables de entorno mínimas para Vercel
    validateEnvironment();

    const mongoDb = MongoDatabase.getInstance();
    await mongoDb.connect(process.env.MONGODB_URI!);
    await mongoDb.createIndexes();

    const container = createContainer();
    cachedApp = createServer(container);
    await cachedApp.ready();
  }
  return cachedApp;
}

function validateEnvironment(): void {
  // Variables esenciales para el funcionamiento básico
  const required = [
    'MONGODB_URI',
    'JWT_PRIVATE_KEY', 
    'JWT_PUBLIC_KEY',
    'AES_ENCRYPTION_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }

  // Configurar valores por defecto para Vercel si no están definidos
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.SMTP_HOST = process.env.SMTP_HOST || 'mock';
  process.env.SMTP_USER = process.env.SMTP_USER || 'mock';
  process.env.SMTP_PASS = process.env.SMTP_PASS || 'mock';
}