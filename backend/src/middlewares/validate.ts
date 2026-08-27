import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware de validación genérico.
 * Recibe un esquema Zod y valida req.body contra él.
 *
 * Uso: router.post('/productos', validate(CrearProductoSchema), controller.crear)
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errores = err.issues.map((issue) => ({
          campo: issue.path.join('.'),
          mensaje: issue.message,
        }));
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          message: errores.map((er) => `${er.campo}: ${er.mensaje}`).join('; '),
        });
        return;
      }
      next(err);
    }
  };
}
