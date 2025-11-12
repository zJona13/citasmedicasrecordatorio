import express from 'express';
import { body, validationResult } from 'express-validator';
import { getUserByEmail, comparePassword, generateToken } from '../auth.js';

const router = express.Router();

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  async (req, res) => {
    try {
      // Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Buscar usuario
      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar si el usuario está activo
      if (!user.activo) {
        return res.status(403).json({ error: 'Usuario inactivo' });
      }

      // Verificar contraseña
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generar token
      const token = generateToken(user);

      // Retornar respuesta (sin incluir la contraseña)
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre_completo: user.nombre_completo,
          rol: user.rol,
        },
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

export default router;

