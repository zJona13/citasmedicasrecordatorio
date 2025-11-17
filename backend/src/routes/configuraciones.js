/**
 * Rutas de configuraciones
 * Requieren autenticación
 */
import express from 'express';
import { authenticateToken } from '../auth.js';
import {
  obtenerConfiguracionesController,
  actualizarConfiguracionesController,
  restaurarConfiguracionesController
} from '../controllers/configuraciones.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/configuraciones - Obtener todas las configuraciones
router.get('/', obtenerConfiguracionesController);

// PUT /api/configuraciones - Actualizar configuraciones (solo admin)
router.put('/', actualizarConfiguracionesController);

// POST /api/configuraciones/restore - Restaurar valores por defecto (solo admin)
router.post('/restore', restaurarConfiguracionesController);

export default router;

