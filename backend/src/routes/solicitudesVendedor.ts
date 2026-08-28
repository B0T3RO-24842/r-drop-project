import { Router } from 'express';
import * as controller from '../controllers/solicitudesVendedor';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { CrearSolicitudVendedorSchema } from '../utils/validaciones';

const router = Router();

router.get('/mia', authenticate, controller.miSolicitud);
router.post('/', authenticate, validate(CrearSolicitudVendedorSchema), controller.crear);

export default router;
