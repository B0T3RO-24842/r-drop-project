import { Request, Response, NextFunction } from 'express';

/**
 * Middleware centralizado de manejo de errores.
 * Captura errores no atrapados y devuelve una respuesta uniforme.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(`[Error] ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
}

/**
 * Middleware para rutas no encontradas (404).
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
  });
}
