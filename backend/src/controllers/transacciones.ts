import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middlewares/auth';
import { calcularComision } from '../config/comisiones';

// IDs de estado de transacción (según seed de schema.sql)
const ESTADO = {
  PAGO_PENDIENTE: 1,
  PAGADO: 2,
  ENVIADO: 3,
  ENTREGADO: 4,
  COMPLETADO: 5,
  CANCELADO: 6,
  EN_DISPUTA: 7,
};

// =============================================
// POST /api/transacciones/crear-desde-oferta
// Flujo de compra normal: el COMPRADOR decide llevarse el
// producto al precio (ya actualizado) de la oferta aceptada.
// Crea la transacción con el desglose de comisión transparente,
// marca la oferta como "Pagada" y actualiza el precio del producto.
// =============================================
export async function crearDesdeOferta(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;
  const { id_oferta } = req.body;

  if (!id_oferta) {
    res.status(400).json({ success: false, error: 'id_oferta es requerido' });
    return;
  }

  // Obtener la oferta con su producto
  const { data: oferta, error: errOferta } = await supabase
    .from('ofertas')
    .select('id_oferta, id_producto, monto, comprador_id, id_estado')
    .eq('id_oferta', id_oferta)
    .single();

  if (errOferta || !oferta) {
    res.status(404).json({ success: false, error: 'Oferta no encontrada' });
    return;
  }

  if (oferta.id_estado !== 2) { // Debe estar Aceptada (2)
    res.status(400).json({ success: false, error: 'Debes completar la compra sobre una oferta aceptada' });
    return;
  }

  // Solo el comprador puede completar la compra de su propia oferta
  if (oferta.comprador_id !== userId) {
    res.status(403).json({ success: false, error: 'Solo el comprador puede completar la compra' });
    return;
  }

  // Verificar que no exista ya una transacción para esta oferta
  const { data: existente } = await supabase
    .from('transacciones')
    .select('id_transaccion')
    .eq('id_oferta', id_oferta)
    .maybeSingle();

  if (existente) {
    res.status(400).json({ success: false, error: 'Ya existe una transacción para esta oferta' });
    return;
  }

  // Obtener el nivel del vendedor para aplicar la comisión adecuada
  const { data: producto } = await supabase
    .from('productos')
    .select('vendedor_id')
    .eq('id_producto', oferta.id_producto)
    .single();

  const { data: vendedor } = await supabase
    .from('usuarios')
    .select('nivel_vendedor')
    .eq('id', producto?.vendedor_id)
    .single();

  // Calcular desglose transparente de comisión sobre el precio acordado
  const desglose = calcularComision(oferta.monto, vendedor?.nivel_vendedor ?? 'estandar');

  const { data, error } = await supabase
    .from('transacciones')
    .insert({
      id_oferta,
      monto_total: desglose.monto_total,
      comision_porcentaje: desglose.comision_porcentaje,
      comision_monto: desglose.comision_monto,
      monto_vendedor: desglose.monto_vendedor,
      id_estado: ESTADO.PAGO_PENDIENTE,
    })
    .select()
    .single();

  if (error) {
    console.error('[Transacciones] Error al crear:', error.message);
    res.status(500).json({ success: false, error: 'Error al crear la transacción' });
    return;
  }

  // Marcar la oferta como "Pagada" (4): el comprador ya completó la compra
  await supabase
    .from('ofertas')
    .update({ id_estado: 4 })
    .eq('id_oferta', id_oferta);

  // Actualizar el producto al precio acordado (el "precio actualizado")
  await supabase
    .from('productos')
    .update({ precio: oferta.monto })
    .eq('id_producto', oferta.id_producto);

  res.status(201).json({
    success: true,
    data,
    desglose_comision: {
      monto_total: desglose.monto_total,
      comision_porcentaje: desglose.comision_porcentaje,
      comision_monto: desglose.comision_monto,
      monto_vendedor: desglose.monto_vendedor,
    },
    message: 'Compra completada. Transacción creada con comisión transparente.',
  });
}

// =============================================
// GET /api/transacciones
// Listar transacciones del usuario autenticado
// (como comprador o vendedor)
// =============================================
export async function listarMias(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;

  // Traer transacciones donde el usuario es comprador o vendedor
  // via la oferta y el producto
  const { data, error } = await supabase
    .from('transacciones')
    .select(`
      *,
      oferta:ofertas!transacciones_id_oferta_fkey(
        id_oferta, monto, comprador_id, mensaje_oferta, created_at,
        producto:productos!ofertas_id_producto_fkey(id_producto, titulo, fotos, vendedor_id, vendedor:usuarios!productos_vendedor_id_fkey(id, nombre_completo))
      ),
      estado:estados_transaccion!transacciones_id_estado_fkey(id_estado, nombre_estado)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Transacciones] Error al listar:', error.message);
    res.status(500).json({ success: false, error: 'Error al obtener transacciones' });
    return;
  }

  // Filtrar en memoria: que el usuario sea comprador o vendedor
  const filtradas = (data ?? []).filter((t) => {
    const vendedorId = t.oferta?.producto?.vendedor_id;
    const compradorId = t.oferta?.comprador_id;
    return vendedorId === userId || compradorId === userId;
  });

  res.json({ success: true, data: filtradas });
}

// =============================================
// GET /api/transacciones/:id
// Obtener una transacción con su desglose (solo partes involucradas)
// =============================================
export async function obtener(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;
  const { id } = req.params;

  const { data, error } = await supabase
    .from('transacciones')
    .select(`
      *,
      oferta:ofertas!transacciones_id_oferta_fkey(
        id_oferta, monto, comprador_id, mensaje_oferta,
        producto:productos!ofertas_id_producto_fkey(
          id_producto, titulo, descripcion, fotos, vendedor_id,
          vendedor:usuarios!productos_vendedor_id_fkey(id, nombre_completo, foto_perfil, nivel_vendedor)
        )
      ),
      estado:estados_transaccion!transacciones_id_estado_fkey(id_estado, nombre_estado)
    `)
    .eq('id_transaccion', parseInt(id, 10))
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Transacción no encontrada' });
    return;
  }

  const vendedorId = data.oferta?.producto?.vendedor_id;
  const compradorId = data.oferta?.comprador_id;

  if (vendedorId !== userId && compradorId !== userId) {
    res.status(403).json({ success: false, error: 'No tienes permiso para ver esta transacción' });
    return;
  }

  // Añadir desglose explícito para máxima transparencia
  res.json({
    success: true,
    data: {
      ...data,
      desglose_comision: {
        monto_total: data.monto_total,
        comision_porcentaje: data.comision_porcentaje,
        comision_monto: data.comision_monto,
        monto_vendedor: data.monto_vendedor,
      },
    },
  });
}

// =============================================
// PATCH /api/transacciones/:id/estado
// Avanzar la transacción por su ciclo:
// pago → envío → entrega → liberación
// =============================================
export async function actualizarEstado(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;
  const { id } = req.params;
  const { estado } = req.body; // 'pagado' | 'enviado' | 'entregado' | 'completado'

  const estadosValidos = ['pagado', 'enviado', 'entregado', 'completado'];
  if (!estadosValidos.includes(estado)) {
    res.status(400).json({ success: false, error: 'Estado inválido' });
    return;
  }

  const { data: transaccion, error: errT } = await supabase
    .from('transacciones')
    .select('*, oferta:ofertas!transacciones_id_oferta_fkey(id_oferta, comprador_id, producto:productos!ofertas_id_producto_fkey(vendedor_id))')
    .eq('id_transaccion', parseInt(id, 10))
    .single();

  if (errT || !transaccion) {
    res.status(404).json({ success: false, error: 'Transacción no encontrada' });
    return;
  }

  const vendedorId = transaccion.oferta?.producto?.vendedor_id;
  const compradorId = transaccion.oferta?.comprador_id;

  // Quién puede hacer cada transición:
  // - pagado: comprador
  // - enviado/entregado: vendedor
  // - completado: cualquiera de las dos tras entrega
  if (estado === 'pagado' && compradorId !== userId) {
    res.status(403).json({ success: false, error: 'Solo el comprador puede confirmar el pago' });
    return;
  }
  if ((estado === 'enviado' || estado === 'entregado') && vendedorId !== userId) {
    res.status(403).json({ success: false, error: 'Solo el vendedor puede marcar este estado' });
    return;
  }
  if (vendedorId !== userId && compradorId !== userId) {
    res.status(403).json({ success: false, error: 'No tienes permiso sobre esta transacción' });
    return;
  }

  const updates: Record<string, unknown> = {};
  const ahora = new Date().toISOString();
  let idEstado = transaccion.id_estado;

  switch (estado) {
    case 'pagado':
      idEstado = ESTADO.PAGADO;
      updates.pagado_at = ahora;
      updates.id_estado = idEstado;
      break;
    case 'enviado':
      idEstado = ESTADO.ENVIADO;
      updates.enviado_at = ahora;
      updates.id_estado = idEstado;
      break;
    case 'entregado':
      idEstado = ESTADO.ENTREGADO;
      updates.entregado_at = ahora;
      updates.id_estado = idEstado;
      break;
    case 'completado':
      idEstado = ESTADO.COMPLETADO;
      updates.liberado_at = ahora;
      updates.id_estado = idEstado;
      break;
  }

  // Si se envía tracking, actualizarlo también
  if (req.body.tracking_number) updates.tracking_number = req.body.tracking_number;
  if (req.body.transportadora) updates.transportadora = req.body.transportadora;

  const { data, error } = await supabase
    .from('transacciones')
    .update(updates)
    .eq('id_transaccion', parseInt(id, 10))
    .select()
    .single();

  if (error) {
    console.error('[Transacciones] Error al actualizar estado:', error.message);
    res.status(500).json({ success: false, error: 'Error al actualizar la transacción' });
    return;
  }

  res.json({ success: true, data, message: `Transacción marcada como ${estado}` });
}
