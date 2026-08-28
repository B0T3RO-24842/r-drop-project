import apiClient from '../config/axios';
import type { ApiResponse } from '../types';

export interface TipoDocumento {
  id_tipo_doc: number;
  nombre_tipo: string;
  descripcion: string;
}

export interface SolicitudVendedor {
  id_solicitud: number;
  usuario_id: string;
  numero_documento: string;
  tipo_documento_id: number;
  foto_documento_frontal: string | null;
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

export async function tipoDocumento(): Promise<ApiResponse<TipoDocumento[]>> {
  const { data } = await apiClient.get('/catalogos/tipos-documento');
  return data;
}

export async function miSolicitudVendedor(): Promise<ApiResponse<SolicitudVendedor | null>> {
  const { data } = await apiClient.get('/solicitudes-vendedor/mia');
  return data;
}

export async function crearSolicitudVendedor(payload: {
  numero_documento: string;
  tipo_documento_id: number;
  ciudad: string;
  direccion: string;
  descripcion_tienda?: string | null;
}): Promise<ApiResponse<SolicitudVendedor>> {
  const { data } = await apiClient.post('/solicitudes-vendedor', payload);
  return data;
}
