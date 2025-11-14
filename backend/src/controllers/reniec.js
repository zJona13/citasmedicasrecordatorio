import { consultarDNI } from '../services/reniec.js';

/**
 * GET /api/reniec/consultar/:dni
 * Consulta datos de una persona por DNI
 * Soporta búsqueda profunda con múltiples variaciones del DNI
 */
export const consultarPorDNI = async (req, res) => {
  try {
    const { dni } = req.params;

    if (!dni) {
      return res.status(400).json({ 
        success: false,
        error: 'DNI es requerido' 
      });
    }

    // Validación básica: el DNI debe contener al menos un dígito
    // El servicio se encargará de normalizar y generar variaciones
    const dniLimpio = dni.toString().replace(/\D/g, '');
    if (!dniLimpio || dniLimpio.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'El DNI debe contener al menos un dígito' 
      });
    }

    // Permitir DNIs con hasta 8 dígitos (el servicio los normalizará)
    if (dniLimpio.length > 8) {
      return res.status(400).json({ 
        success: false,
        error: 'El DNI no puede tener más de 8 dígitos' 
      });
    }

    const datos = await consultarDNI(dni);

    res.json({
      success: true,
      data: datos,
    });
  } catch (error) {
    console.error('[RENIEC Controller] Error en consulta:', {
      message: error.message,
      code: error.code,
      status: error.status,
      detail: error.detail,
    });
    
    // Determinar el código de estado HTTP
    const statusCode = error.status || 500;
    
    // Construir respuesta de error
    const errorResponse = {
      success: false,
      error: error.message || 'Error al consultar RENIEC',
    };

    // Agregar información adicional según el tipo de error
    if (error.code === 'RENIEC_ENV_MISSING') {
      errorResponse.error = 'Servicio de RENIEC no configurado correctamente';
      errorResponse.code = error.code;
      return res.status(500).json(errorResponse);
    }
    
    if (error.code === 'RENIEC_INVALID_DNI' || error.code === 'RENIEC_NO_VARIATIONS') {
      errorResponse.error = error.message;
      errorResponse.code = error.code;
      return res.status(400).json(errorResponse);
    }

    // Si es un error de búsqueda profunda fallida, incluir información sobre los intentos
    if (error.code === 'RENIEC_DEEP_SEARCH_FAILED' && error.detail) {
      errorResponse.error = `No se encontró información para el DNI después de intentar ${error.detail.total_intentos} variación(es)`;
      errorResponse.code = error.code;
      errorResponse.detail = {
        dni_original: error.detail.dni_original,
        total_intentos: error.detail.total_intentos,
        variaciones_intentadas: error.detail.variaciones_intentadas,
      };
      // No incluir los errores completos en la respuesta por seguridad
      return res.status(404).json(errorResponse);
    }

    // Si es un error 404 (no encontrado)
    if (statusCode === 404 || error.message.includes('no encontrado') || error.message.includes('no se encontró')) {
      errorResponse.error = 'DNI no encontrado en RENIEC';
      errorResponse.code = error.code || 'RENIEC_NOT_FOUND';
      
      // Si hay información de búsqueda profunda, incluirla
      if (error.detail && error.detail.variaciones_intentadas) {
        errorResponse.detail = {
          variaciones_intentadas: error.detail.variaciones_intentadas.length,
        };
      }
      
      return res.status(404).json(errorResponse);
    }

    // Error de conexión o del servidor
    if (error.code === 'RENIEC_FETCH_FAILED' || error.code === 'RENIEC_INVALID_JSON') {
      errorResponse.error = 'Error de conexión con el servicio de RENIEC. Intente nuevamente.';
      errorResponse.code = error.code;
      return res.status(502).json(errorResponse);
    }

    // Error reportado por el servicio RENIEC
    if (error.code === 'RENIEC_REPORTED_ERROR') {
      errorResponse.error = 'El servicio de RENIEC reportó un error';
      errorResponse.code = error.code;
      return res.status(502).json(errorResponse);
    }

    // Error genérico
    errorResponse.code = error.code || 'RENIEC_UNKNOWN_ERROR';
    return res.status(statusCode).json(errorResponse);
  }
};

