import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middlewares/auth';

// IDs de estado de ofertas (según seed de schema.sql)
const ESTADO = {
  PENDIENTE: 1,
  ACEPTADA: 2,
  RECHAZADA: 3,
  PAGADA: 4,
  CANCELADA: 5,
};

// =============================================
// POST /api/ofertas
// Crear una oferta sobre un producto (comprador autenticado)
// =============================================
export async function crear(req: AuthRequest, res: Response): Promise<void> {
  const compradorId = req.usuario!.id;
  const { id_producto, monto, mensaje_oferta } = req.body;

  // Verificar que el producto existe y obtener su vendedor
  const { data: producto, error: errProducto } = await supabase
    .from('productos')
    .select('vendedor_id, titulo')
    .eq('id_producto', id_producto)
    .single();

  if (errProducto || !producto) {
    res.status(404).json({ success: false, error: 'Producto no encontrado' });
    return;
  }

  // Regla anti-auto-oferta (validación en app para buen mensaje, además del trigger DB)
  if (producto.vendedor_id === compradorId) {
    res.status(400).json({ success: false, error: 'No puedes ofertar en tu propio producto' });
    return;
  }

  // Verificar que el producto sigue disponible
  const { data: disponibleCheck } = await supabase
    .from('productos')
    .select('disponible')
    .eq('id_producto', id_producto)
    .single();

  if (disponibleCheck && disponibleCheck.disponible === false) {
    res.status(400).json({ success: false, error: 'Este producto ya no está disponible' });
    return;
  }

  const { data, error } = await supabase
    .from('ofertas')
    .insert({
      id_producto,
      comprador_id: compradorId,
      monto,
      id_estado: ESTADO.PENDIENTE,
      mensaje_oferta: mensaje_oferta ?? null,
    })
    .select()
    .single();

  if (error) {
    // El trigger validar_no_autooferta también lanza su propio mensaje
    const msg = error.message.includes('autooferta') || error.message.includes('propio')
      ? 'No puedes ofertar en tu propio producto'
      : 'Error al crear la oferta';
    console.error('[Ofertas] Error al crear:', error.message);
    res.status(400).json({ success: false, error: msg });
    return;
  }

  res.status(201).json({ success: true, data, message: 'Oferta enviada correctamente' });
}

// =============================================
// GET /api/ofertas/mias
// Listar ofertas del usuario autenticado (como comprador)
// =============================================
export async function misOfertasComoComprador(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;

  const { data, error } = await supabase
    .from('ofertas')
    .select(`
      *,
      producto:productos!ofertas_id_producto_fkey(id_producto, titulo, precio, fotos),
      estado:estados_oferta!ofertas_id_estado_fkey(id_estado, nombre_estado)
    `)
    .eq('comprador_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Ofertas] Error al listar:', error.message);
    res.status(500).json({ success: false, error: 'Error al obtener tus ofertas' });
    return;
  }

  res.json({ success: true, data });
}

// =============================================
// GET /api/ofertas/producto/:id
// Listar ofertas recibidas para un producto del vendedor
// =============================================
export async function ofertasDeProducto(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;
  const { id } = req.params;

  // Verificar que el producto pertenece al vendedor autenticado
  const { data: producto, error: errProducto } = await supabase
    .from('productos')
    .select('vendedor_id')
    .eq('id_producto', parseInt(id, 10))
    .single();

  if (errProducto || !producto) {
    res.status(404).json({ success: false, error: 'Producto no encontrado' });
    return;
  }

  if (producto.vendedor_id !== userId) {
    res.status(403).json({ success: false, error: 'No tienes permiso para ver estas ofertas' });
    return;
  }

  const { data, error } = await supabase
    .from('ofertas')
    .select(`
      *,
      comprador:usuarios!ofertas_comprador_id_fkey(id, nombre_completo, foto_perfil),
      estado:estados_oferta!ofertas_id_estado_fkey(id_estado, nombre_estado)
    `)
    .eq('id_producto', parseInt(id, 10))
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Ofertas] Error al listar:', error.message);
    res.status(500).json({ success: false, error: 'Error al obtener las ofertas' });
    return;
  }

  res.json({ success: true, data });
}

// =============================================
// GET /api/ofertas/recibidas
// Listar todas las ofertas recibidas para TODOS los productos del vendedor
// =============================================
export async function ofertasRecibidas(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;

  // Productos del vendedor
  const { data: productos } = await supabase
    .from('productos')
    .select('id_producto')
    .eq('vendedor_id', userId);

  if (!productos || productos.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }

  const ids = productos.map((p) => p.id_producto);

  const { data, error } = await supabase
    .from('ofertas')
    .select(`
      *,
      producto:productos!ofertas_id_producto_fkey(id_producto, titulo, fotos, vendedor_id),
      comprador:usuarios!ofertas_comprador_id_fkey(id, nombre_completo, foto_perfil),
      estado:estados_oferta!ofertas_id_estado_fkey(id_estado, nombre_estado)
    `)
    .in('id_producto', ids)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Ofertas] Error al listar recibidas:', error.message);
    res.status(500).json({ success: false, error: 'Error al obtener ofertas recibidas' });
    return;
  }

  res.json({ success: true, data });
}

// =============================================
// POST /api/ofertas/:id/aceptar
// El vendedor acepta una oferta. La transacción se crea aparte (en transacciones controller)
// =============================================
export async function aceptar(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;
  const { id } = req.params;

  // Obtener la oferta con su producto y comprador
  const { data: oferta, error: errOferta } = await supabase
    .from('ofertas')
    .select('id, id_producto, monto, id_estado, comprador_id')
    .eq('id_oferta', parseInt(id, 10))
    .single();

  if (errOferta || !oferta) {
    res.status(404).json({ success: false, error: 'Oferta no encontrada' });
    return;
  }

  // Verificar que el usuario es el vendedor del producto
  const { data: producto } = await supabase
    .from('productos')
    .select('vendedor_id')
    .eq('id_producto', oferta.id_producto)
    .single();

  if (!producto || producto.vendedor_id !== userId) {
    res.status(403).json({ success: false, error: 'Solo el vendedor puede aceptar esta oferta' });
    return;
  }

  if (oferta.id_estado !== 1) {
    res.status(400).json({ success: false, error: 'La oferta ya no está pendiente' });
    return;
  }

  // Aceptar la oferta (estado 2) y marcar producto como no disponible
  const { error: errAceptar } = await supabase
    .from('ofertas')
    .update({ id_estado: ESTADO.ACEPTADA, aceptada_at: new Date().toISOString() })
    .eq('id_oferta', parseInt(id, 10));

  if (errAceptar) {
    console.error('[Ofertas] Error al aceptar:', errAceptar.message);
    res.status(500).json({ success: false, error: 'Error al aceptar la oferta' });
    return;
  }

  await supabase
    .from('productos')
    .update({ disponible: false })
    .eq('id_producto', oferta.id_producto);

  res.json({ success: true, message: 'Oferta aceptada. El comprador podrá completar la compra al precio acordado.' });
}

// =============================================
// POST /api/ofertas/:id/rechazar
// El vendedor rechaza una oferta
// =============================================
export async function rechazar(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;
  const { id } = req.params;

  const { data: oferta, error: errOferta } = await supabase
    .from('ofertas')
    .select('id, id_producto, id_estado')
    .eq('id_oferta', parseInt(id, 10))
    .single();

  if (errOferta || !oferta) {
    res.status(404).json({ success: false, error: 'Oferta no encontrada' });
    return;
  }

  const { data: producto } = await supabase
    .from('productos')
    .select('vendedor_id')
    .eq('id_producto', oferta.id_producto)
    .single();

  if (!producto || producto.vendedor_id !== userId) {
    res.status(403).json({ success: false, error: 'Solo el vendedor puede rechazar esta oferta' });
    return;
  }

  const { error } = await supabase
    .from('ofertas')
    .update({ id_estado: ESTADO.RECHAZADA, rechazada_at: new Date().toISOString() })
    .eq('id_oferta', parseInt(id, 10));

  if (error) {
    console.error('[Ofertas] Error al rechazar:', error.message);
    res.status(500).json({ success: false, error: 'Error al rechazar la oferta' });
    return;
  }

  res.json({ success: true, message: 'Oferta rechazada' });
}

// =============================================
// POST /api/ofertas/:id/cancelar
// El comprador cancela su propia oferta pendiente
// =============================================
export async function cancelar(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;
  const { id } = req.params;

  const { data: oferta, error: errOferta } = await supabase
    .from('ofertas')
    .select('id, comprador_id, id_estado')
    .eq('id_oferta', parseInt(id, 10))
    .single();

  if (errOferta || !oferta) {
    res.status(404).json({ success: false, error: 'Oferta no encontrada' });
    return;
  }

  if (oferta.comprador_id !== userId) {
    res.status(403).json({ success: false, error: 'Solo el comprador puede cancelar esta oferta' });
    return;
  }

  if (oferta.id_estado !== 1) {
    res.status(400).json({ success: false, error: 'Solo se pueden cancelar ofertas pendientes' });
    return;
  }

  const { error } = await supabase
    .from('ofertas')
    .update({ id_estado: ESTADO.CANCELADA })
    .eq('id_oferta', parseInt(id, 10));

  if (error) {
    console.error('[Ofertas] Error al cancelar:', error.message);
    res.status(500).json({ success: false, error: 'Error al cancelar la oferta' });
    return;
  }

  res.json({ success: true, message: 'Oferta cancelada' });
}
