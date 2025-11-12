import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Middleware para autenticar tokens JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
};

// Función para generar token JWT
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol: user.rol,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Función para hash de contraseña
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Función para verificar contraseña
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Función para obtener usuario por email
export const getUserByEmail = async (email) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, password, nombre_completo, rol, activo FROM usuarios WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Función para obtener usuario por ID
export const getUserById = async (id) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, nombre_completo, rol, activo FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting user by id:', error);
    throw error;
  }
};

