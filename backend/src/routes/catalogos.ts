import { Router } from 'express';
import * as controller from '../controllers/catalogos';

const router = Router();

// Todos los catálogos en una sola llamada (para el frontend al cargar)
router.get('/todos', controller.todos);

// Catálogos individuales
router.get('/generos', controller.generos);
router.get('/categorias', controller.categorias);
router.get('/estados-producto', controller.estadosProducto);

export default router;
