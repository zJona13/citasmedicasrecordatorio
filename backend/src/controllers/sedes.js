/**
 * Controlador de sedes
 */
import {
  obtenerSedes,
  obtenerTodasLasSedes,
  obtenerSedePorId,
  obtenerSedePorDefecto,
  crearSede,
  actualizarSede,
  eliminarSede
} from '../services/sedes.js';

/**
 * GET /api/sedes
 * Obtiene todas las sedes activas
 */
export const getSedes = async (req, res) => {
  try {
    const { todas } = req.query;
    
    const sedes = todas === 'true'
      ? await obtenerTodasLasSedes()
      : await obtenerSedes();
    
    res.json(sedes);
  } catch (error) {
    console.error('Error obteniendo sedes:', error);
    res.status(500).json({ error: 'Error al obtener sedes' });
  }
};

/**
 * GET /api/sedes/por-defecto
 * Obtiene la sede por defecto
 */
export const getSedePorDefecto = async (req, res) => {
  try {
    const sede = await obtenerSedePorDefecto();
    
    if (!sede) {
      return res.status(404).json({ error: 'No se encontró ninguna sede activa' });
    }
    
    res.json(sede);
  } catch (error) {
    console.error('Error obteniendo sede por defecto:', error);
    res.status(500).json({ error: 'Error al obtener sede por defecto' });
  }
};

/**
 * GET /api/sedes/:id
 * Obtiene una sede por ID
 */
export const getSedePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const sede = await obtenerSedePorId(id);
    
    if (!sede) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }
    
    res.json(sede);
  } catch (error) {
    console.error('Error obteniendo sede por ID:', error);
    res.status(500).json({ error: 'Error al obtener sede' });
  }
};

/**
 * POST /api/sedes
 * Crea una nueva sede
 * Requiere autenticación y rol admin
 */
export const createSede = async (req, res) => {
  try {
    // Validar que el usuario es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden crear sedes' });
    }
    
    const datosSede = req.body;
    const sede = await crearSede(datosSede);
    
    res.status(201).json(sede);
  } catch (error) {
    console.error('Error creando sede:', error);
    
    if (error.message && error.message.includes('Ya existe')) {
      return res.status(409).json({ error: error.message });
    }
    
    if (error.message && error.message.includes('requeridos')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error al crear sede' });
  }
};

/**
 * PUT /api/sedes/:id
 * Actualiza una sede
 * Requiere autenticación y rol admin
 */
export const updateSede = async (req, res) => {
  try {
    // Validar que el usuario es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden actualizar sedes' });
    }
    
    const { id } = req.params;
    const datosSede = req.body;
    
    const sede = await actualizarSede(id, datosSede);
    
    res.json(sede);
  } catch (error) {
    console.error('Error actualizando sede:', error);
    
    if (error.message && error.message.includes('no encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message && error.message.includes('Ya existe')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error al actualizar sede' });
  }
};

/**
 * DELETE /api/sedes/:id
 * Elimina una sede (soft delete)
 * Requiere autenticación y rol admin
 */
export const deleteSede = async (req, res) => {
  try {
    // Validar que el usuario es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden eliminar sedes' });
    }
    
    const { id } = req.params;
    await eliminarSede(id);
    
    res.json({ message: 'Sede eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando sede:', error);
    
    if (error.message && error.message.includes('no encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error al eliminar sede' });
  }
};

