import express from 'express';
import { authenticateToken } from '../auth.js';
import { 
  getProfesionales, 
  createProfesional, 
  updateProfesional, 
  deleteProfesional 
} from '../controllers/profesionales.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getProfesionales);
router.post('/', createProfesional);
router.put('/:id', updateProfesional);
router.delete('/:id', deleteProfesional);

export default router;

