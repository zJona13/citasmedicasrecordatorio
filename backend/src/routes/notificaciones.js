import express from 'express';
import { getNotificaciones, marcarLeida, marcarTodasLeidas } from '../controllers/notificaciones.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/notificaciones
router.get('/', getNotificaciones);

// PATCH /api/notificaciones/:id/leer
router.patch('/:id/leer', marcarLeida);

// PATCH /api/notificaciones/leer-todas
router.patch('/leer-todas', marcarTodasLeidas);

export default router;

