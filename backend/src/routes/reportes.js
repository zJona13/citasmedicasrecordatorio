import express from 'express';
import { authenticateToken } from '../auth.js';
import { 
  getReporteGeneral, 
  getReportePorEspecialidad, 
  getReportePorProfesional, 
  getReportePorPaciente 
} from '../controllers/reportes.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/general', getReporteGeneral);
router.get('/especialidades', getReportePorEspecialidad);
router.get('/profesionales', getReportePorProfesional);
router.get('/pacientes', getReportePorPaciente);

export default router;

