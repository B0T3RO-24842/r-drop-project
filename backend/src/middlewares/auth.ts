import { Request, Response, NextFunction } from 'express';
import { JWTPayload, jwtVerify } from 'jose';
import { supabase } from '../config/supabase';

// Extender Request para incluir el usuario decodificado
export interface AuthRequest extends Request {
  usuario?: JWTPayload & {
    id: string;
    email: string;
  };
}

// Secret del JWT de Supabase (lo sacamos del .env)
const SUPABASE_JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

/**
 * Middleware de autenticación.
 * Verifica el Bearer token del header Authorization contra el JWT secret de Supabase.
 * Si es válido, decodifica el payload y lo adjunta a req.usuario.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    const { payload } = await jwtVerify(token, SUPABASE_JWT_SECRET);

    req.usuario = {
      ...payload,
      id: payload.sub as string,
      email: payload.email as string,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Token inválido o expirado',
    });
  }
}

/**
 * Middleware de autorización por roles.
 * Debe usarse después de authenticate.
 *
 * Uso: router.delete('/productos/:id', authenticate, authorize('vendedor', 'admin'), controller.eliminar)
 */
export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({
        success: false,
        error: 'No autenticado',
      });
      return;
    }

    // El rol viene del JWT claims (supabase lo guarda en user_metadata o app_metadata)
    // Lo más seguro es consultar la tabla usuarios para el rol real
    // Por ahora lo sacamos del JWT y en el futuro podemos hacer un query
    const rol = req.usuario.role as string | undefined;

    if (rol && !roles.includes(rol)) {
      res.status(403).json({
        success: false,
        error: 'No tienes permiso para realizar esta acción',
      });
      return;
    }

    next();
  };
}
