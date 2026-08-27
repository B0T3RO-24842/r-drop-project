import { Router } from 'express';
import * as controller from '../controllers/productos';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { CrearProductoSchema, ActualizarProductoSchema } from '../utils/validaciones';

const router = Router();

// ⚠️ Rutas específicas ANTES de /:id (Express las matchea en orden)
router.get('/mis-productos', authenticate, controller.misProductos);

// Rutas públicas
router.get('/', controller.listar);
router.get('/:id', controller.obtener);

// Rutas autenticadas
router.post('/', authenticate, validate(CrearProductoSchema), controller.crear);
router.put('/:id', authenticate, validate(ActualizarProductoSchema), controller.actualizar);
router.delete('/:id', authenticate, controller.eliminar);

export default router;
