import express from 'express';
import { authenticateToken } from '../auth.js';
import { getCitas, createCita, updateCita, confirmarCita, cancelarCita } from '../controllers/citas.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getCitas);
router.post('/', createCita);
router.put('/:id', updateCita);
router.patch('/:id/confirmar', confirmarCita);
router.patch('/:id/cancelar', cancelarCita);

export default router;

