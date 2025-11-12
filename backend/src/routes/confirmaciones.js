import express from 'express';
import { authenticateToken } from '../auth.js';
import { getConfirmaciones } from '../controllers/confirmaciones.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getConfirmaciones);

export default router;

