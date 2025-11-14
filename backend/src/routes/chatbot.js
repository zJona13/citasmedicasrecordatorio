/**
 * Rutas del chatbot (públicas, sin autenticación)
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  procesarMensajeChatbot,
  obtenerEspecialidadesChatbot,
  obtenerProfesionalesChatbot,
  obtenerDisponibilidadChatbot,
  crearCitaChatbot,
  agregarListaEsperaChatbot
} from '../controllers/chatbot.js';

const router = express.Router();

// Rate limiting para prevenir abuso
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.'
});

// Aplicar rate limiting a todas las rutas
router.use(limiter);

// Rutas del chatbot
router.post('/message', procesarMensajeChatbot);
router.get('/specialties', obtenerEspecialidadesChatbot);
router.get('/professionals/:specialtyId', obtenerProfesionalesChatbot);
router.get('/availability/:professionalId', obtenerDisponibilidadChatbot);
router.post('/appointment', crearCitaChatbot);
router.post('/waiting-list', agregarListaEsperaChatbot);

export default router;

