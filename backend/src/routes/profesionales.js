import express from 'express';
import { authenticateToken } from '../auth.js';
import { getProfesionales } from '../controllers/profesionales.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getProfesionales);

export default router;

