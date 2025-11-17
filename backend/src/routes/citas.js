import express from 'express';
import { authenticateToken } from '../auth.js';
import { getCitas, createCita, updateCita, confirmarCita, cancelarCita, marcarNoShow, buscarCitasPorDNI } from '../controllers/citas.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getCitas);
router.get('/buscar/:dni', buscarCitasPorDNI);
router.post('/', createCita);
router.put('/:id', updateCita);
router.patch('/:id/confirmar', confirmarCita);
router.patch('/:id/cancelar', cancelarCita);
router.patch('/:id/no-show', marcarNoShow);

export default router;

