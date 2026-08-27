// =============================================
// Tipos del backend — alineados con schema.sql v4.0
// =============================================

// --- Tablas catálogo ---

export interface Genero {
  id_genero: number;
  nombre_genero: string;
  descripcion: string | null;
}

export interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
  descripcion: string | null;
  activo: boolean;
}

export interface EstadoProducto {
  id_estado: number;
  nombre_estado: string;
  descripcion: string | null;
  orden_calidad: number;
}

export interface EstadoOferta {
  id_estado: number;
  nombre_estado: string;
  descripcion: string | null;
}

export interface EstadoTransaccion {
  id_estado: number;
  nombre_estado: string;
  descripcion: string | null;
}

export interface EstadoDisputa {
  id_estado: number;
  nombre_estado: string;
  descripcion: string | null;
}

export interface TipoDocumento {
  id_tipo_doc: number;
  nombre_tipo: string;
  descripcion: string | null;
}

// --- Tabla usuarios ---

export interface Usuario {
  id: string; // UUID
  nombre_completo: string;
  email: string;
  telefono: string;
  id_tipo_doc: number;
  foto_perfil: string | null;
  rol: 'comprador' | 'vendedor' | 'admin';
  puntos_fiabilidad: number;
  nivel_vendedor: 'estandar' | 'pro';
  total_ventas: number;
  cuenta_bancaria: string | null;
  verificado: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// --- Tabla solicitudes_vendedor ---

export interface SolicitudVendedor {
  id_solicitud: number;
  usuario_id: string;
  numero_documento: string;
  tipo_documento_id: number;
  foto_documento_frontal: string;
  foto_documento_trasera: string | null;
  selfie_con_documento: string | null;
  ciudad: string;
  direccion: string;
  descripcion_tienda: string | null;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  motivo_rechazo: string | null;
  revisado_por: string | null;
  created_at: string;
  resuelta_at: string | null;
}

// --- Tabla productos ---

export interface Producto {
  id_producto: number;
  vendedor_id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  id_categoria: number;
  id_genero: number;
  talla: string | null;
  id_estado_producto: number;
  marca: string | null;
  fotos: string[]; // JSONB en DB, array de URLs
  disponible: boolean;
  vistas: number;
  created_at: string;
  updated_at: string;
}

// --- Tabla ofertas ---

export interface Oferta {
  id_oferta: number;
  id_producto: number;
  comprador_id: string;
  monto: number;
  id_estado: number;
  mensaje_oferta: string | null;
  created_at: string;
  aceptada_at: string | null;
  rechazada_at: string | null;
}

// --- Tabla transacciones ---

export interface Transaccion {
  id_transaccion: number;
  id_oferta: number;
  monto_total: number;
  comision_porcentaje: number;
  comision_monto: number;
  monto_vendedor: number;
  id_estado: number;
  payment_intent_id: string | null;
  tracking_number: string | null;
  transportadora: string | null;
  created_at: string;
  pagado_at: string | null;
  enviado_at: string | null;
  entregado_at: string | null;
  liberado_at: string | null;
}

// --- Tabla mensajes ---

export interface Mensaje {
  id_mensaje: number;
  conversacion_id: string; // UUID agrupa la conversación
  id_producto: number;
  remitente_id: string;
  destinatario_id: string;
  contenido: string;
  archivo_adjunto: string | null;
  leido: boolean;
  created_at: string;
}

// --- Tabla disputas ---

export interface Disputa {
  id_disputa: number;
  id_transaccion: number;
  iniciador_id: string;
  motivo: string;
  evidencia_fotos: string[] | null; // JSONB array de URLs
  id_estado: number;
  resolucion: string | null;
  ganador_id: string | null;
  revisado_por: string | null;
  created_at: string;
  resuelta_at: string | null;
}

// --- Tabla resenas ---

export interface Resena {
  id_resena: number;
  id_transaccion: number;
  autor_id: string;
  evaluado_id: string;
  calificacion: number; // 1-5
  comentario: string;
  fotos_producto: string[] | null; // JSONB array de URLs
  verificada: boolean;
  created_at: string;
}

// --- DTOs (para crear/actualizar) ---

export type CrearProducto = Omit<Producto, 'id_producto' | 'vendedor_id' | 'vistas' | 'created_at' | 'updated_at'>;

export type ActualizarProducto = Partial<Omit<Producto, 'id_producto' | 'vendedor_id' | 'created_at' | 'updated_at'>>;

export type CrearOferta = Omit<Oferta, 'id_oferta' | 'created_at' | 'aceptada_at' | 'rechazada_at'>;

export type CrearSolicitud = Omit<SolicitudVendedor, 'id_solicitud' | 'estado' | 'motivo_rechazo' | 'revisado_por' | 'created_at' | 'resuelta_at'>;

export type CrearMensaje = Omit<Mensaje, 'id_mensaje' | 'leido' | 'created_at'>;

export type CrearDisputa = Omit<Disputa, 'id_disputa' | 'resolucion' | 'ganador_id' | 'revisado_por' | 'created_at' | 'resuelta_at'>;

export type CrearResena = Omit<Resena, 'id_resena' | 'verificada' | 'created_at'>;

// --- Respuesta API genérica ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
