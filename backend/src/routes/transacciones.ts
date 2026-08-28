import { Router } from 'express';
import * as controller from '../controllers/transacciones';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { z } from 'zod';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

const CrearDesdeOfertaSchema = z.object({
  id_oferta: z.number().int().positive(),
});

// Debe ir antes de /:id
router.post('/crear-desde-oferta', validate(CrearDesdeOfertaSchema), controller.crearDesdeOferta);

// CRUD
router.get('/', controller.listarMias);
router.get('/:id', controller.obtener);

// Cambio de estado
router.patch('/:id/estado', controller.actualizarEstado);

export default router;
