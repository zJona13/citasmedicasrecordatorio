/**
 * Rutas de sedes
 * Requieren autenticación
 */
import express from 'express';
import { authenticateToken } from '../auth.js';
import {
  getSedes,
  getSedePorDefecto,
  getSedePorId,
  createSede,
  updateSede,
  deleteSede
} from '../controllers/sedes.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/sedes - Obtener todas las sedes activas
router.get('/', getSedes);

// GET /api/sedes/por-defecto - Obtener sede por defecto
router.get('/por-defecto', getSedePorDefecto);

// GET /api/sedes/:id - Obtener una sede por ID
router.get('/:id', getSedePorId);

// POST /api/sedes - Crear nueva sede (solo admin)
router.post('/', createSede);

// PUT /api/sedes/:id - Actualizar sede (solo admin)
router.put('/:id', updateSede);

// DELETE /api/sedes/:id - Eliminar sede (solo admin)
router.delete('/:id', deleteSede);

export default router;

