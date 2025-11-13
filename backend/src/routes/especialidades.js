import express from 'express';
import { authenticateToken } from '../auth.js';
import { 
  getEspecialidades, 
  createEspecialidad, 
  updateEspecialidad, 
  deleteEspecialidad 
} from '../controllers/especialidades.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getEspecialidades);
router.post('/', createEspecialidad);
router.put('/:id', updateEspecialidad);
router.delete('/:id', deleteEspecialidad);

export default router;

