import { z } from 'zod';

export const CrearProductoSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  precio: z.number().positive('El precio debe ser mayor a 0'),
  id_categoria: z.number().int().positive(),
  id_genero: z.number().int().positive(),
  talla: z.string().max(20).nullable().optional(),
  id_estado_producto: z.number().int().positive(),
  marca: z.string().max(100).nullable().optional(),
  fotos: z.array(z.string().url('Cada foto debe ser una URL válida')).min(1, 'Al menos una foto es requerida'),
});

export const ActualizarProductoSchema = z.object({
  titulo: z.string().min(3).max(200).optional(),
  descripcion: z.string().min(10).optional(),
  precio: z.number().positive().optional(),
  id_categoria: z.number().int().positive().optional(),
  id_genero: z.number().int().positive().optional(),
  talla: z.string().max(20).nullable().optional(),
  id_estado_producto: z.number().int().positive().optional(),
  marca: z.string().max(100).nullable().optional(),
  fotos: z.array(z.string().url()).min(1).optional(),
  disponible: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar',
});

// =============================================
// Ofertas
// =============================================

export const CrearOfertaSchema = z.object({
  id_producto: z.number().int().positive(),
  monto: z.number().positive('El monto de la oferta debe ser mayor a 0'),
  mensaje_oferta: z.string().max(500).nullable().optional(),
});

// =============================================
// Solicitud de vendedor
// =============================================

export const CrearSolicitudVendedorSchema = z.object({
  numero_documento: z.string().min(3, 'El número de documento es requerido').max(50),
  tipo_documento_id: z.number().int().positive('Selecciona un tipo de documento'),
  foto_documento_frontal: z.string().url('Foto frontal inválida').nullable().optional(),
  foto_documento_trasera: z.string().url('Foto trasera inválida').nullable().optional(),
  selfie_con_documento: z.string().url('Selfie inválida').nullable().optional(),
  ciudad: z.string().min(2, 'La ciudad es requerida').max(100),
  direccion: z.string().min(5, 'La dirección es requerida').max(255),
  descripcion_tienda: z.string().max(500).nullable().optional(),
});

// =============================================
// Subir foto de producto
// =============================================

export const SubirFotoSchema = z.object({
  base64: z.string()
    .min(1, 'La imagen es requerida')
    .max(11_000_000, 'La imagen es demasiado grande')
    .refine((v) => !/\s/.test(v), 'La imagen en base64 es inválida'),
  mime: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']).optional(),
});
