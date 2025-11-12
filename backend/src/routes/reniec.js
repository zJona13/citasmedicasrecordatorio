import express from 'express';
import { authenticateToken } from '../auth.js';
import { consultarPorDNI } from '../controllers/reniec.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/reniec/consultar/:dni
router.get('/consultar/:dni', consultarPorDNI);

export default router;

