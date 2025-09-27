import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    console.log('🚀 Handler iniciado');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Test básico primero
    if (req.url === '/health' || req.url === '/') {
      return res.status(200).json({
        success: true,
        message: 'SIGma Backend en Vercel',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
      });
    }

    // Importación dinámica para evitar problemas en cold start
    const { default: createAppInstance } = await import('../src/index');
    
    console.log('📦 Creando instancia de aplicación...');
    const app = await createAppInstance();
    
    console.log('⚡ Preparando aplicación...');
    await app.ready();
    
    console.log('🔄 Inyectando request...');
    const response = await app.inject({
      method: req.method as any,
      url: req.url || '/',
      headers: req.headers,
      body: req.body,
      query: req.query,
    });

    // Establecer headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value as string);
    });

    console.log('✅ Respuesta exitosa:', response.statusCode);
    res.status(response.statusCode);
    
    // Parsear response si es JSON
    try {
      const jsonResponse = JSON.parse(response.payload);
      return res.json(jsonResponse);
    } catch {
      return res.send(response.payload);
    }

  } catch (error) {
    console.error('❌ Error en handler de Vercel:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};
