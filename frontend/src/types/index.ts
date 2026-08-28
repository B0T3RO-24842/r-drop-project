// =============================================
// Tipos del frontend — alineados con la API real
// =============================================

// --- Tipos de la API ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limite: number;
    total: number;
    paginas: number;
  };
}

// --- Catálogos ---

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

export interface Catalogos {
  generos: Genero[];
  categorias: Categoria[];
  estados_producto: EstadoProducto[];
}

// --- Usuario ---

export interface User {
  id: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  foto_perfil?: string;
  rol?: 'comprador' | 'vendedor' | 'admin';
  puntos_fiabilidad: number;
  nivel_vendedor?: 'estandar' | 'pro';
  total_ventas?: number;
  verificado?: boolean;
}

// --- Producto (shape real de la API con JOINs) ---

export interface Product {
  id_producto: number;
  vendedor_id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  talla?: string | null;
  marca?: string | null;
  fotos: string[];
  disponible: boolean;
  vistas: number;
  id_genero: number;
  created_at: string;
  // Objetos anidados del JOIN
  categoria?: Categoria;
  genero?: Genero;
  estado_producto?: EstadoProducto;
  vendedor?: Pick<User, 'id' | 'nombre_completo' | 'foto_perfil' | 'nivel_vendedor' | 'puntos_fiabilidad'>;
}

// --- Oferta ---

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
  // Objetos anidados
  producto?: Pick<Product, 'id_producto' | 'titulo' | 'precio' | 'fotos' | 'id_genero' | 'vendedor_id'>;
  comprador?: Pick<User, 'id' | 'nombre_completo' | 'foto_perfil'>;
  estado?: Pick<EstadoOferta, 'id_estado' | 'nombre_estado'>;
}

export interface EstadoOferta {
  id_estado: number;
  nombre_estado: string;
  descripcion: string | null;
}

// --- Desglose de comisión (transparencia, anti-GoTrendier) ---

export interface DesgloseComision {
  monto_total: number;
  comision_porcentaje: number;
  comision_monto: number;
  monto_vendedor: number;
}

// --- Transacción ---

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
  // Objetos anidados
  oferta?: Oferta;
  estado?: Pick<EstadoTransaccion, 'id_estado' | 'nombre_estado'>;
  desglose_comision?: DesgloseComision;
}

export interface EstadoTransaccion {
  id_estado: number;
  nombre_estado: string;
  descripcion: string | null;
}

// --- Auth ---

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, nombre: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}
