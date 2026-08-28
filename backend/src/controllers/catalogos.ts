import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middlewares/auth';

// GET /api/catalogos/generos
export async function generos(_req: AuthRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('generos')
    .select('*')
    .order('id_genero');

  if (error) {
    res.status(500).json({ success: false, error: 'Error al obtener géneros' });
    return;
  }
  res.json({ success: true, data });
}

// GET /api/catalogos/categorias
export async function categorias(_req: AuthRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('activo', true)
    .order('id_categoria');

  if (error) {
    res.status(500).json({ success: false, error: 'Error al obtener categorías' });
    return;
  }
  res.json({ success: true, data });
}

// GET /api/catalogos/estados-producto
export async function estadosProducto(_req: AuthRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('estados_producto')
    .select('*')
    .order('orden_calidad');

  if (error) {
    res.status(500).json({ success: false, error: 'Error al obtener estados de producto' });
    return;
  }
  res.json({ success: true, data });
}

// GET /api/catalogos/tipos-documento
export async function tiposDocumento(_req: AuthRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('tipo_documento')
    .select('*')
    .order('id_tipo_doc');

  if (error) {
    res.status(500).json({ success: false, error: 'Error al obtener tipos de documento' });
    return;
  }
  res.json({ success: true, data });
}

// GET /api/catalogos/todos
// Devuelve todos los catálogos en una sola llamada (evita 3 requests separados)
export async function todos(_req: AuthRequest, res: Response): Promise<void> {
  const [gen, cat, est] = await Promise.all([
    supabase.from('generos').select('*').order('id_genero'),
    supabase.from('categorias').select('*').eq('activo', true).order('id_categoria'),
    supabase.from('estados_producto').select('*').order('orden_calidad'),
  ]);

  if (gen.error || cat.error || est.error) {
    console.error('[Catálogos] Error:', gen.error?.message, cat.error?.message, est.error?.message);
    res.status(500).json({ success: false, error: 'Error al obtener catálogos' });
    return;
  }

  res.json({
    success: true,
    data: {
      generos: gen.data,
      categorias: cat.data,
      estados_producto: est.data,
    },
  });
}
