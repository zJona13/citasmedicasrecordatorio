/**
 * Controlador de configuraciones
 */
import { 
  obtenerConfiguraciones, 
  actualizarConfiguraciones,
  restaurarValoresPorDefecto 
} from '../services/configuraciones.js';

/**
 * GET /api/configuraciones
 * Obtiene todas las configuraciones
 */
export const obtenerConfiguracionesController = async (req, res) => {
  try {
    const configuraciones = await obtenerConfiguraciones();
    res.json(configuraciones);
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
};

/**
 * PUT /api/configuraciones
 * Actualiza las configuraciones
 * Requiere autenticación y rol admin
 */
export const actualizarConfiguracionesController = async (req, res) => {
  try {
    // Validar que el usuario es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden modificar configuraciones' });
    }
    
    const configuraciones = req.body;
    
    // Validar que se enviaron configuraciones
    if (!configuraciones || typeof configuraciones !== 'object') {
      return res.status(400).json({ error: 'Se requiere un objeto de configuraciones' });
    }
    
    await actualizarConfiguraciones(configuraciones);
    
    res.json({ 
      message: 'Configuraciones actualizadas exitosamente',
      configuraciones: await obtenerConfiguraciones()
    });
  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    
    if (error.message && error.message.includes('Claves inválidas')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error al actualizar configuraciones' });
  }
};

/**
 * POST /api/configuraciones/restore
 * Restaura todas las configuraciones a sus valores por defecto
 * Requiere autenticación y rol admin
 */
export const restaurarConfiguracionesController = async (req, res) => {
  try {
    // Validar que el usuario es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden restaurar configuraciones' });
    }
    
    await restaurarValoresPorDefecto();
    
    res.json({ 
      message: 'Configuraciones restauradas a valores por defecto',
      configuraciones: await obtenerConfiguraciones()
    });
  } catch (error) {
    console.error('Error restaurando configuraciones:', error);
    res.status(500).json({ error: 'Error al restaurar configuraciones' });
  }
};

