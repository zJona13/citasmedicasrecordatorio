import express from 'express';
import { authenticateToken } from '../auth.js';
import { getDashboardStats, getTrendChart, getOccupationChart } from '../controllers/dashboard.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/stats', getDashboardStats);
router.get('/charts/trend', getTrendChart);
router.get('/charts/occupation', getOccupationChart);

export default router;

