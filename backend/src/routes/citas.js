import express from 'express';
import { authenticateToken } from '../auth.js';
import { getCitas, createCita, updateCita, confirmarCita, cancelarCita, marcarNoShow, buscarCitasPorDNI, exportarCitasCSV } from '../controllers/citas.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas específicas deben ir antes de las genéricas
router.get('/exportar', exportarCitasCSV);
router.get('/buscar/:dni', buscarCitasPorDNI);
router.get('/', getCitas);
router.post('/', createCita);
router.put('/:id', updateCita);
router.patch('/:id/confirmar', confirmarCita);
router.patch('/:id/cancelar', cancelarCita);
router.patch('/:id/no-show', marcarNoShow);

export default router;

