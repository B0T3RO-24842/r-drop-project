import apiClient from '../config/axios';
import type { Catalogos, ApiResponse } from '../types';

export async function obtenerCatalogos(): Promise<ApiResponse<Catalogos>> {
  const { data } = await apiClient.get('/catalogos/todos');
  return data;
}
