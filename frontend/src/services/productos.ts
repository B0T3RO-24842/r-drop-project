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
