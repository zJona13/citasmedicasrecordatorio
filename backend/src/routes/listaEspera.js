import express from 'express';
import { authenticateToken } from '../auth.js';
import { getListaEspera } from '../controllers/listaEspera.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getListaEspera);

export default router;

