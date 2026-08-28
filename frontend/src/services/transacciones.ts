import apiClient from '../config/axios';
import type { ApiResponse, Transaccion } from '../types';

export async function listarTransacciones(): Promise<ApiResponse<Transaccion[]>> {
  const { data } = await apiClient.get('/transacciones');
  return data;
}

export async function crearTransaccionDesdeOferta(idOferta: number): Promise<ApiResponse<Transaccion>> {
  const { data } = await apiClient.post('/transacciones/crear-desde-oferta', { id_oferta: idOferta });
  return data;
}

export async function actualizarEstadoTransaccion(
  id: number,
  estado: 'pagado' | 'enviado' | 'entregado' | 'completado',
  extra?: { tracking_number?: string; transportadora?: string }
): Promise<ApiResponse<Transaccion>> {
  const { data } = await apiClient.patch(`/transacciones/${id}/estado`, { estado, ...extra });
  return data;
}
