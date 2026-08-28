import { Request, Response, NextFunction } from 'express';
import { JWTPayload, createRemoteJWKSet, jwtVerify } from 'jose';

// Extender Request para incluir el usuario decodificado
export interface AuthRequest extends Request {
  usuario?: JWTPayload & {
    id: string;
    email: string;
  };
}

/**
 * Supabase firma los access tokens con ES256 (clave pública/privada).
 * La clave pública de verificación se obtiene del JWKS del proyecto.
 * NOTA: la URL del JWKS es https://<proyecto>.supabase.co/auth/v1/.well-known/jwks.json
 * y requiere el apikey (anon/publishable) como query param para poder accederla.
 */
const supabaseUrl = process.env.SUPABASE_URL;
// Anon/publishable key (pública) para acceder al JWKS de verificación.
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function obtenerJwks() {
  if (jwks) return jwks;
  const url = `${supabaseUrl}/auth/v1/.well-known/jwks.json?apikey=${supabaseAnonKey}`;
  jwks = createRemoteJWKSet(new URL(url), { cooldownDuration: 60_000 });
  return jwks;
}

/**
 * Middleware de autenticación.
 * Verifica el Bearer token del header Authorization contra la firma ES256
 * de Supabase (vía JWKS). Si es válido, decodifica el payload y lo adjunta
 * a req.usuario.
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

    const { payload } = await jwtVerify(token, obtenerJwks());

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
