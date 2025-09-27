import { VercelRequest, VercelResponse } from '@vercel/node';
import createAppInstance from '../src/index';

let cachedApp: any = null;

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (!cachedApp) {
      console.log('Inicializando aplicación Fastify...');
      cachedApp = await createAppInstance();
      await cachedApp.ready();
      console.log('Aplicación Fastify lista');
    }

    await cachedApp
      .inject({
        method: req.method as any,
        url: req.url || '/',
        headers: req.headers,
        body: req.body,
        query: req.query,
      })
      .then((response: any) => {
        Object.entries(response.headers).forEach(([key, value]) => {
          res.setHeader(key, value as string);
        });

        res.status(response.statusCode);
        res.send(response.payload);
      });
  } catch (error) {
    console.error('Error in Vercel handler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
