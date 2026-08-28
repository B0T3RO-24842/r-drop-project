import apiClient from '../config/axios';
import type { Product, PaginatedResponse, ApiResponse } from '../types';

interface ProductosFiltros {
  search?: string;
  id_categoria?: number;
  id_genero?: number;
  id_estado_producto?: number;
  marca?: string;
  precio_min?: number;
  precio_max?: number;
  ordenar_por?: string;
  direccion?: 'asc' | 'desc';
  page?: number;
  limite?: number;
}

export async function listarProductos(filtros: ProductosFiltros = {}): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const { data } = await apiClient.get(`/productos?${params.toString()}`);
  return data;
}

export async function obtenerProducto(id: number): Promise<ApiResponse<Product>> {
  const { data } = await apiClient.get(`/productos/${id}`);
  return data;
}

export async function misProductos(): Promise<ApiResponse<Product[]>> {
  const { data } = await apiClient.get('/productos/mis-productos');
  return data;
}

export interface CrearProductoPayload {
  titulo: string;
  descripcion: string;
  precio: number;
  id_categoria: number;
  id_genero: number;
  talla?: string | null;
  id_estado_producto: number;
  marca?: string | null;
  fotos: string[];
}

export async function crearProducto(payload: CrearProductoPayload): Promise<ApiResponse<Product>> {
  const { data } = await apiClient.post('/productos', payload);
  return data;
}

export async function subirFotoProducto(base64: string, mime: string): Promise<ApiResponse<{ url: string }>> {
  const { data } = await apiClient.post('/productos/upload-foto', { base64, mime });
  return data;
}
