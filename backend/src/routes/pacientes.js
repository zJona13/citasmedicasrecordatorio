import express from 'express';
import { authenticateToken } from '../auth.js';
import { 
  getPacientes, 
  createPaciente, 
  updatePaciente, 
  deletePaciente 
} from '../controllers/pacientes.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getPacientes);
router.post('/', createPaciente);
router.put('/:id', updatePaciente);
router.delete('/:id', deletePaciente);

export default router;

