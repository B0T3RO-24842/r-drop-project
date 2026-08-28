import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middlewares/auth';

// =============================================
// GET /api/solicitudes-vendedor/mia
// Ver la solicitud del usuario autenticado
// =============================================
export async function miSolicitud(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;

  const { data, error } = await supabase
    .from('solicitudes_vendedor')
    .select('*')
    .eq('usuario_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Solicitudes] Error al obtener:', error.message);
    res.status(500).json({ success: false, error: 'Error al obtener tu solicitud' });
    return;
  }

  res.json({ success: true, data: data ?? null });
}

// =============================================
// POST /api/solicitudes-vendedor
// Crear una solicitud para hacerse vendedor
// =============================================
export async function crear(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;
  const body = req.body;

  // Un usuario sólo puede tener una solicitud activa (UNIQUE usuario_id)
  const { data: existente, error: errExistente } = await supabase
    .from('solicitudes_vendedor')
    .select('id_solicitud, estado')
    .eq('usuario_id', userId)
    .maybeSingle();

  if (errExistente) {
    console.error('[Solicitudes] Error al verificar:', errExistente.message);
    res.status(500).json({ success: false, error: 'Error al crear la solicitud' });
    return;
  }

  if (existente) {
    res.status(409).json({
      success: false,
      error: `Ya tienes una solicitud en estado "${existente.estado}".`,
    });
    return;
  }

  const { data, error } = await supabase
    .from('solicitudes_vendedor')
    .insert({
      usuario_id: userId,
      numero_documento: body.numero_documento,
      tipo_documento_id: body.tipo_documento_id,
      foto_documento_frontal: body.foto_documento_frontal
        ?? 'https://placehold.co/300x200?text=Documento+pendiente',
      foto_documento_trasera: body.foto_documento_trasera ?? null,
      selfie_con_documento: body.selfie_con_documento ?? null,
      ciudad: body.ciudad,
      direccion: body.direccion,
      descripcion_tienda: body.descripcion_tienda ?? null,
      estado: 'pendiente',
    })
    .select()
    .single();

  if (error) {
    console.error('[Solicitudes] Error al crear:', error.message);
    res.status(500).json({ success: false, error: 'Error al crear la solicitud' });
    return;
  }

  res.status(201).json({
    success: true,
    data,
    message: 'Solicitud enviada correctamente. Un administrador la revisará.',
  });
}
