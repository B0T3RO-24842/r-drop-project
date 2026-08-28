import { Router } from 'express';
import * as controller from '../controllers/ofertas';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { CrearOfertaSchema } from '../utils/validaciones';

const router = Router();

// Todas las rutas de ofertas requieren autenticación
router.use(authenticate);

// Rutas específicas ANTES de /:id
router.get('/mias', controller.misOfertasComoComprador);
router.get('/recibidas', controller.ofertasRecibidas);
router.get('/producto/:id', controller.ofertasDeProducto);

// CRUD
router.post('/', validate(CrearOfertaSchema), controller.crear);
router.post('/:id/aceptar', controller.aceptar);
router.post('/:id/rechazar', controller.rechazar);
router.post('/:id/cancelar', controller.cancelar);

export default router;
