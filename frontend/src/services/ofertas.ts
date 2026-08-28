import apiClient from '../config/axios';
import type { ApiResponse, Oferta } from '../types';

export async function crearOferta(payload: {
  id_producto: number;
  monto: number;
  mensaje_oferta?: string | null;
}): Promise<ApiResponse<Oferta>> {
  const { data } = await apiClient.post('/ofertas', payload);
  return data;
}

export async function misOfertasComoComprador(): Promise<ApiResponse<Oferta[]>> {
  const { data } = await apiClient.get('/ofertas/mias');
  return data;
}

export async function ofertasRecibidas(): Promise<ApiResponse<Oferta[]>> {
  const { data } = await apiClient.get('/ofertas/recibidas');
  return data;
}

export async function aceptarOferta(id: number): Promise<ApiResponse> {
  const { data } = await apiClient.post(`/ofertas/${id}/aceptar`);
  return data;
}

export async function rechazarOferta(id: number): Promise<ApiResponse> {
  const { data } = await apiClient.post(`/ofertas/${id}/rechazar`);
  return data;
}

export async function cancelarOferta(id: number): Promise<ApiResponse> {
  const { data } = await apiClient.post(`/ofertas/${id}/cancelar`);
  return data;
}
