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
