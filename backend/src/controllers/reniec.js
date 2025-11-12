import { consultarDNI } from '../services/reniec.js';

/**
 * GET /api/reniec/consultar/:dni
 * Consulta datos de una persona por DNI
 */
export const consultarPorDNI = async (req, res) => {
  try {
    const { dni } = req.params;

    if (!dni) {
      return res.status(400).json({ error: 'DNI es requerido' });
    }

    // Validar formato de DNI (8 dígitos)
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ error: 'DNI debe tener 8 dígitos' });
    }

    const datos = await consultarDNI(dni);

    res.json({
      success: true,
      data: datos,
    });
  } catch (error) {
    console.error('Error en consulta RENIEC:', error);
    
    // Manejar diferentes tipos de errores
    if (error.message.includes('no configurados')) {
      return res.status(500).json({ 
        error: 'Servicio de RENIEC no configurado correctamente' 
      });
    }
    
    if (error.message.includes('inválido')) {
      return res.status(400).json({ error: error.message });
    }

    // Si la API devuelve un error (ej: DNI no encontrado)
    if (error.message.includes('404') || error.message.includes('no encontrado')) {
      return res.status(404).json({ 
        error: 'DNI no encontrado en RENIEC',
        success: false 
      });
    }

    res.status(500).json({ 
      error: 'Error al consultar RENIEC',
      message: error.message 
    });
  }
};

