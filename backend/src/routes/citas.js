import express from 'express';
import { authenticateToken } from '../auth.js';
import { getCitas, createCita } from '../controllers/citas.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getCitas);
router.post('/', createCita);

export default router;

