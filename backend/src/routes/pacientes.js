import express from 'express';
import { authenticateToken } from '../auth.js';
import { getPacientes } from '../controllers/pacientes.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getPacientes);

export default router;

