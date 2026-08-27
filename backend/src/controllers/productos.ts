import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middlewares/auth';
import { CrearProducto, ActualizarProducto } from '../types';

// =============================================
// GET /api/productos
// Listar productos con filtros, búsqueda y paginación
// =============================================
export async function listar(req: AuthRequest, res: Response): Promise<void> {
  const {
    search,
    id_categoria,
    id_genero,
    id_estado_producto,
    marca,
    precio_min,
    precio_max,
    ordenar_por = 'created_at',
    direccion = 'desc',
    page = '1',
    limite = '12',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limite, 10) || 12));
  const desde = (pageNum - 1) * limitNum;

  let query = supabase
    .from('productos')
    .select(`
      *,
      vendedor:usuarios!productos_vendedor_id_fkey(id, nombre_completo, foto_perfil, nivel_vendedor, puntos_fiabilidad),
      categoria:categorias!productos_id_categoria_fkey(id_categoria, nombre_categoria),
      genero:generos!productos_id_genero_fkey(id_genero, nombre_genero),
      estado_producto:estados_producto!productos_id_estado_producto_fkey(id_estado, nombre_estado, orden_calidad)
    `, { count: 'exact' })
    .eq('disponible', true);

  // Filtros
  if (search) {
    query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%,marca.ilike.%${search}%`);
  }
  if (id_categoria) query = query.eq('id_categoria', parseInt(id_categoria, 10));
  if (id_genero) query = query.eq('id_genero', parseInt(id_genero, 10));
  if (id_estado_producto) query = query.eq('id_estado_producto', parseInt(id_estado_producto, 10));
  if (marca) query = query.ilike('marca', `%${marca}%`);
  if (precio_min) query = query.gte('precio', parseFloat(precio_min));
  if (precio_max) query = query.lte('precio', parseFloat(precio_max));

  // Ordenamiento
  const columnasValidas = ['created_at', 'precio', 'vistas'];
  const col = columnasValidas.includes(ordenar_por) ? ordenar_por : 'created_at';
  const dir = direccion === 'asc' ? true : false;
  query = query.order(col, { ascending: dir });

  // Paginación
  query = query.range(desde, desde + limitNum - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Productos] Error al listar:', error.message, error.details);
    res.status(500).json({ success: false, error: 'Error al listar productos' });
    return;
  }

  res.json({
    success: true,
    data: data,
    pagination: {
      page: pageNum,
      limite: limitNum,
      total: count ?? 0,
      paginas: Math.ceil((count ?? 0) / limitNum),
    },
  });
}

// =============================================
// GET /api/productos/:id
// Obtener un producto por ID (incrementa vistas)
// =============================================
export async function obtener(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  // Incrementar vistas (fire and forget)
  supabase.rpc('incrementar_vistas', { pid: parseInt(id, 10) }).select();

  const { data, error } = await supabase
    .from('productos')
    .select(`
      *,
      vendedor:usuarios!productos_vendedor_id_fkey(id, nombre_completo, foto_perfil, nivel_vendedor, puntos_fiabilidad, total_ventas),
      categoria:categorias!productos_id_categoria_fkey(id_categoria, nombre_categoria),
      genero:generos!productos_id_genero_fkey(id_genero, nombre_genero),
      estado_producto:estados_producto!productos_id_estado_producto_fkey(id_estado, nombre_estado, orden_calidad)
    `)
    .eq('id_producto', parseInt(id, 10))
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Producto no encontrado' });
    return;
  }

  res.json({ success: true, data });
}

// =============================================
// POST /api/productos
// Crear un producto (solo vendedores autenticados)
// =============================================
export async function crear(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;
  const body: CrearProducto = req.body;

  const { data, error } = await supabase
    .from('productos')
    .insert({
      vendedor_id: userId,
      titulo: body.titulo,
      descripcion: body.descripcion,
      precio: body.precio,
      id_categoria: body.id_categoria,
      id_genero: body.id_genero,
      talla: body.talla ?? null,
      id_estado_producto: body.id_estado_producto,
      marca: body.marca ?? null,
      fotos: body.fotos,
    })
    .select()
    .single();

  if (error) {
    console.error('[Productos] Error al crear:', error.message);
    res.status(500).json({ success: false, error: 'Error al crear el producto' });
    return;
  }

  res.status(201).json({ success: true, data, message: 'Producto creado correctamente' });
}

// =============================================
// PUT /api/productos/:id
// Actualizar un producto (solo el dueño)
// =============================================
export async function actualizar(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.usuario!.id;
  const body: ActualizarProducto = req.body;

  // Verificar que el producto existe y es del usuario
  const { data: existente, error: errExistente } = await supabase
    .from('productos')
    .select('vendedor_id')
    .eq('id_producto', parseInt(id, 10))
    .single();

  if (errExistente || !existente) {
    res.status(404).json({ success: false, error: 'Producto no encontrado' });
    return;
  }

  if (existente.vendedor_id !== userId) {
    res.status(403).json({ success: false, error: 'No tienes permiso para editar este producto' });
    return;
  }

  const { data, error } = await supabase
    .from('productos')
    .update(body)
    .eq('id_producto', parseInt(id, 10))
    .select()
    .single();

  if (error) {
    console.error('[Productos] Error al actualizar:', error.message);
    res.status(500).json({ success: false, error: 'Error al actualizar el producto' });
    return;
  }

  res.json({ success: true, data, message: 'Producto actualizado correctamente' });
}

// =============================================
// DELETE /api/productos/:id
// Eliminar un producto (solo el dueño)
// =============================================
export async function eliminar(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.usuario!.id;

  const { data: existente, error: errExistente } = await supabase
    .from('productos')
    .select('vendedor_id')
    .eq('id_producto', parseInt(id, 10))
    .single();

  if (errExistente || !existente) {
    res.status(404).json({ success: false, error: 'Producto no encontrado' });
    return;
  }

  if (existente.vendedor_id !== userId) {
    res.status(403).json({ success: false, error: 'No tienes permiso para eliminar este producto' });
    return;
  }

  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id_producto', parseInt(id, 10));

  if (error) {
    console.error('[Productos] Error al eliminar:', error.message);
    res.status(500).json({ success: false, error: 'Error al eliminar el producto' });
    return;
  }

  res.json({ success: true, message: 'Producto eliminado correctamente' });
}

// =============================================
// GET /api/productos/mis-productos
// Listar productos del vendedor autenticado
// =============================================
export async function misProductos(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.usuario!.id;

  const { data, error } = await supabase
    .from('productos')
    .select(`
      *,
      categoria:categorias!productos_id_categoria_fkey(nombre_categoria),
      genero:generos!productos_id_genero_fkey(nombre_genero),
      estado_producto:estados_producto!productos_id_estado_producto_fkey(nombre_estado)
    `)
    .eq('vendedor_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ success: false, error: 'Error al obtener tus productos' });
    return;
  }

  res.json({ success: true, data });
}
