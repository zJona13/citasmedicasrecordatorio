/**
 * Servicio de mensajería para WhatsApp usando whatsapp-web.js
 * Reemplaza la funcionalidad de SMS con WhatsApp
 */
import { pool } from '../db.js';
import { obtenerConfiguracion } from './configuraciones.js';
import { enviarMensajeWhatsApp } from './whatsapp.js';
import dotenv from 'dotenv';

dotenv.config();

const DEMO_MODE = process.env.WHATSAPP_DEMO_MODE === 'true';

/**
 * Envía un SMS (ahora usa WhatsApp)
 * @param {string} to - Número de teléfono destino (formato: +1234567890 o 1234567890)
 * @param {string} message - Mensaje a enviar
 * @returns {Promise<Object>}
 */
export async function enviarSMS(to, message) {
  // Ahora SMS se envía por WhatsApp
  return await enviarWhatsApp(to, message);
}

/**
 * Envía un mensaje de WhatsApp
 * @param {string} to - Número de teléfono destino (formato: +1234567890 o 1234567890)
 * @param {string} message - Mensaje a enviar
 * @returns {Promise<Object>}
 */
export async function enviarWhatsApp(to, message) {
  if (DEMO_MODE) {
    console.log('[DEMO MODE] WhatsApp no enviado:', { to, message });
    return {
      success: true,
      sid: 'demo_sid',
      mode: 'demo'
    };
  }

  try {
    const result = await enviarMensajeWhatsApp(to, message);
    return result;
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    throw error;
  }
}

/**
 * Envía mensaje por el canal preferido (ahora siempre WhatsApp)
 * @param {string} to - Número de teléfono destino
 * @param {string} message - Mensaje a enviar
 * @param {string} canal - 'SMS' o 'WhatsApp' (ambos usan WhatsApp ahora)
 * @returns {Promise<Object>}
 */
export async function enviarMensaje(to, message, canal = 'SMS') {
  // Ahora todos los mensajes se envían por WhatsApp
  return await enviarWhatsApp(to, message);
}

/**
 * Formatea número de teléfono para WhatsApp
 * @param {string} telefono - Número de teléfono
 * @returns {string} Número formateado (sin +, solo dígitos con código de país)
 */
export function formatearTelefono(telefono) {
  // Remover espacios y caracteres especiales, mantener solo dígitos
  let numero = telefono.replace(/\D/g, '');
  
  // Si empieza con 0, removerlo
  if (numero.startsWith('0')) {
    numero = numero.substring(1);
  }
  
  // Si no empieza con código de país de Perú (51), agregarlo
  if (!numero.startsWith('51')) {
    numero = '51' + numero;
  }
  
  return numero;
}

/**
 * Reemplaza variables en una plantilla de mensaje
 * @param {string} plantilla - Plantilla con variables {nombre}, {fecha}, {hora}, {especialidad}, {tiempo}
 * @param {Object} datos - Objeto con los datos para reemplazar
 * @returns {string} Mensaje con variables reemplazadas
 */
export function reemplazarVariables(plantilla, datos) {
  let mensaje = plantilla;
  
  // Formatear fecha
  const fechaFormateada = datos.fecha 
    ? new Date(datos.fecha).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '';
  
  // Formatear hora
  const horaFormateada = datos.hora 
    ? datos.hora.substring(0, 5)
    : '';
  
  // Reemplazar variables
  mensaje = mensaje.replace(/{nombre}/g, datos.nombre || datos.patient || '');
  mensaje = mensaje.replace(/{fecha}/g, fechaFormateada);
  mensaje = mensaje.replace(/{hora}/g, horaFormateada);
  mensaje = mensaje.replace(/{especialidad}/g, datos.especialidad || datos.specialty || '');
  mensaje = mensaje.replace(/{doctor}/g, datos.doctor || '');
  mensaje = mensaje.replace(/{tiempo}/g, datos.tiempo || datos.minutosExpiracion || '30');
  
  return mensaje;
}

/**
 * Template: Recordatorio 24h antes de la cita
 */
export function templateRecordatorio24h(cita) {
  const fecha = new Date(cita.fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  return `Recordatorio: Cita el ${fecha} a las ${cita.hora.substring(0, 5)} con ${cita.doctor}. Confirme su asistencia.`;
}

/**
 * Template: Confirmación 3h antes de la cita
 */
export function templateConfirmacion3h(cita) {
  const fecha = new Date(cita.fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit'
  });
  
  return `Confirme su cita: ${fecha} ${cita.hora.substring(0, 5)} con ${cita.doctor}. Responda CONFIRMAR o CANCELAR.`;
}

/**
 * Template: Confirmación manual de cita
 */
export function templateConfirmacionManual(cita) {
  const fecha = new Date(cita.fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit'
  });
  
  return `Cita confirmada: ${fecha} ${cita.hora.substring(0, 5)} con ${cita.doctor}. Llegue 10 min antes. Hospital Luis Heysen II.`;
}

/**
 * Template: Notificación de espacio disponible en lista de espera
 */
export async function templateOfertaListaEspera(cita, minutosExpiracion = 15) {
  // Intentar obtener plantilla personalizada
  try {
    const plantillaPersonalizada = await obtenerConfiguracion('mensaje_oferta_cupo');
    if (plantillaPersonalizada && plantillaPersonalizada !== '') {
      return reemplazarVariables(plantillaPersonalizada, {
        nombre: cita.patient || cita.nombre || '',
        fecha: cita.fecha,
        hora: cita.hora,
        especialidad: cita.specialty || cita.especialidad || '',
        doctor: cita.doctor || '',
        tiempo: minutosExpiracion.toString(),
        minutosExpiracion: minutosExpiracion.toString()
      });
    }
  } catch (error) {
    console.warn('Error obteniendo plantilla personalizada, usando plantilla por defecto:', error);
  }
  
  // Plantilla por defecto
  const fecha = new Date(cita.fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit'
  });
  
  // Acortar nombre del doctor si es muy largo
  const doctorNombre = cita.doctor.length > 25 
    ? cita.doctor.split(' ').slice(0, 2).join(' ') 
    : cita.doctor;
  
  return `Espacio disponible: ${fecha} ${cita.hora.substring(0, 5)} con ${doctorNombre}. Responda ACEPTAR en ${minutosExpiracion} min o IGNORAR.`;
}

/**
 * Envía recordatorio 24h antes de la cita
 * @param {Object} cita - Objeto con información de la cita
 * @param {string} canal - 'SMS' o 'WhatsApp'
 * @returns {Promise<Object>}
 */
export async function enviarRecordatorio24h(cita, canal = 'SMS') {
  if (!cita.telefono) {
    console.warn('No se puede enviar recordatorio: paciente sin teléfono');
    return { success: false, error: 'Sin teléfono' };
  }

  const mensaje = templateRecordatorio24h(cita);
  const telefono = formatearTelefono(cita.telefono);

  try {
    const resultado = await enviarMensaje(telefono, mensaje, canal);

    // Registrar en confirmaciones
    await pool.execute(
      `INSERT INTO confirmaciones (cita_id, canal, fecha_envio, estado_envio, respuesta) 
       VALUES (?, ?, NOW(), 'entregado', 'pendiente')`,
      [cita.id, canal]
    );

    return resultado;
  } catch (error) {
    console.error('Error enviando recordatorio 24h:', error);
    
    // Registrar fallo
    try {
      await pool.execute(
        `INSERT INTO confirmaciones (cita_id, canal, fecha_envio, estado_envio, respuesta) 
         VALUES (?, ?, NOW(), 'fallido', 'pendiente')`,
        [cita.id, canal]
      );
    } catch (dbError) {
      console.error('Error registrando fallo:', dbError);
    }

    throw error;
  }
}

/**
 * Envía confirmación 3h antes de la cita
 * @param {Object} cita - Objeto con información de la cita
 * @param {string} canal - 'SMS' o 'WhatsApp'
 * @returns {Promise<Object>}
 */
export async function enviarConfirmacion3h(cita, canal = 'SMS') {
  if (!cita.telefono) {
    console.warn('No se puede enviar confirmación: paciente sin teléfono');
    return { success: false, error: 'Sin teléfono' };
  }

  const mensaje = templateConfirmacion3h(cita);
  const telefono = formatearTelefono(cita.telefono);

  try {
    const resultado = await enviarMensaje(telefono, mensaje, canal);

    // Registrar en confirmaciones
    await pool.execute(
      `INSERT INTO confirmaciones (cita_id, canal, fecha_envio, estado_envio, respuesta) 
       VALUES (?, ?, NOW(), 'entregado', 'pendiente')`,
      [cita.id, canal]
    );

    return resultado;
  } catch (error) {
    console.error('Error enviando confirmación 3h:', error);
    
    // Registrar fallo
    try {
      await pool.execute(
        `INSERT INTO confirmaciones (cita_id, canal, fecha_envio, estado_envio, respuesta) 
         VALUES (?, ?, NOW(), 'fallido', 'pendiente')`,
        [cita.id, canal]
      );
    } catch (dbError) {
      console.error('Error registrando fallo:', dbError);
    }

    throw error;
  }
}

/**
 * Envía confirmación manual de cita (cuando se confirma desde el panel)
 * @param {Object} cita - Objeto con información de la cita
 * @param {string} canal - 'SMS' o 'WhatsApp'
 * @returns {Promise<Object>}
 */
export async function enviarConfirmacionManual(cita, canal = 'SMS') {
  if (!cita.telefono) {
    console.warn('No se puede enviar confirmación manual: paciente sin teléfono');
    return { success: false, error: 'Sin teléfono' };
  }

  // Intentar obtener plantilla personalizada
  let mensaje;
  try {
    const plantillaPersonalizada = await obtenerConfiguracion('mensaje_confirmacion');
    if (plantillaPersonalizada && plantillaPersonalizada !== '') {
      mensaje = reemplazarVariables(plantillaPersonalizada, {
        nombre: cita.patient || cita.nombre || '',
        fecha: cita.fecha,
        hora: cita.hora,
        especialidad: cita.specialty || cita.especialidad || '',
        doctor: cita.doctor || ''
      });
    } else {
      mensaje = templateConfirmacionManual(cita);
    }
  } catch (error) {
    console.warn('Error obteniendo plantilla personalizada, usando plantilla por defecto:', error);
    mensaje = templateConfirmacionManual(cita);
  }

  const telefono = formatearTelefono(cita.telefono);

  try {
    const resultado = await enviarMensaje(telefono, mensaje, canal);

    // Registrar en confirmaciones como confirmada
    await pool.execute(
      `INSERT INTO confirmaciones (cita_id, canal, fecha_envio, estado_envio, respuesta) 
       VALUES (?, ?, NOW(), 'entregado', 'confirmada')`,
      [cita.id, canal]
    );

    return resultado;
  } catch (error) {
    console.error('Error enviando confirmación manual:', error);
    
    // Registrar fallo
    try {
      await pool.execute(
        `INSERT INTO confirmaciones (cita_id, canal, fecha_envio, estado_envio, respuesta) 
         VALUES (?, ?, NOW(), 'fallido', 'pendiente')`,
        [cita.id, canal]
      );
    } catch (dbError) {
      console.error('Error registrando fallo:', dbError);
    }

    throw error;
  }
}

/**
 * Envía notificación de espacio disponible en lista de espera
 * @param {Object} cita - Objeto con información de la cita propuesta
 * @param {Object} paciente - Objeto con información del paciente
 * @param {string} canal - 'SMS' o 'WhatsApp'
 * @param {number} minutosExpiracion - Minutos hasta que expire la oferta
 * @returns {Promise<Object>}
 */
export async function enviarOfertaListaEspera(cita, paciente, canal = 'SMS', minutosExpiracion = null) {
  if (!paciente.telefono) {
    console.warn('No se puede enviar oferta: paciente sin teléfono');
    return { success: false, error: 'Sin teléfono' };
  }

  // Obtener tiempo máximo de oferta desde configuraciones si no se proporciona
  if (minutosExpiracion === null) {
    try {
      minutosExpiracion = await obtenerConfiguracion('tiempo_max_oferta');
    } catch (error) {
      minutosExpiracion = 30; // Valor por defecto
    }
  }

  const mensaje = await templateOfertaListaEspera({
    ...cita,
    patient: paciente.nombre_completo || paciente.nombre || cita.patient
  }, minutosExpiracion);
  const telefono = formatearTelefono(paciente.telefono);

  try {
    const resultado = await enviarMensaje(telefono, mensaje, canal);
    return resultado;
  } catch (error) {
    console.error('Error enviando oferta de lista de espera:', error);
    throw error;
  }
}

/**
 * Procesa respuesta de confirmación desde SMS/WhatsApp
 * @param {string} telefono - Número de teléfono que respondió
 * @param {string} mensaje - Mensaje recibido
 * @returns {Promise<Object>}
 */
export async function procesarRespuestaConfirmacion(telefono, mensaje) {
  const mensajeNormalizado = mensaje.trim().toUpperCase();
  
  // Limpiar número de teléfono (remover caracteres especiales y prefijos)
  const telefonoLimpio = telefono.replace(/\D/g, '');
  // Si tiene código de país, removerlo para búsqueda
  const telefonoBusqueda = telefonoLimpio.length > 9 ? telefonoLimpio.slice(-9) : telefonoLimpio;
  
  // Buscar cita pendiente de confirmación para este teléfono
  const [citas] = await pool.execute(
    `SELECT c.id, c.estado, c.fecha, c.hora, 
            pa.nombre_completo, pr.nombre_completo as doctor, e.nombre as specialty
     FROM citas c
     INNER JOIN pacientes pa ON c.paciente_id = pa.id
     INNER JOIN profesionales pr ON c.profesional_id = pr.id
     INNER JOIN especialidades e ON pr.especialidad_id = e.id
     WHERE REPLACE(REPLACE(pa.telefono, ' ', ''), '-', '') LIKE ? 
     AND c.estado = 'pendiente'
     AND c.fecha >= CURDATE()
     ORDER BY c.fecha ASC, c.hora ASC
     LIMIT 1`,
    [`%${telefonoBusqueda}%`]
  );

  if (citas.length === 0) {
    return { success: false, error: 'No se encontró cita pendiente' };
  }

  const cita = citas[0];
  let respuesta = 'pendiente';
  let estadoCita = cita.estado;

  if (mensajeNormalizado.includes('CONFIRMAR') || mensajeNormalizado.includes('SI') || mensajeNormalizado === 'S') {
    respuesta = 'confirmada';
    estadoCita = 'confirmada';
  } else if (mensajeNormalizado.includes('CANCELAR') || mensajeNormalizado.includes('NO') || mensajeNormalizado === 'N') {
    respuesta = 'rechazada';
    estadoCita = 'cancelada';
  } else {
    return { success: false, error: 'Respuesta no reconocida. Responda CONFIRMAR o CANCELAR.' };
  }

  // Actualizar cita y confirmación
  await pool.execute(
    `UPDATE citas SET estado = ? WHERE id = ?`,
    [estadoCita, cita.id]
  );

  await pool.execute(
    `UPDATE confirmaciones 
     SET respuesta = ?, fecha_respuesta = NOW() 
     WHERE cita_id = ? 
     AND respuesta = 'pendiente'
     ORDER BY fecha_envio DESC LIMIT 1`,
    [respuesta, cita.id]
  );

  return {
    success: true,
    cita: {
      id: cita.id,
      estado: estadoCita,
      respuesta
    }
  };
}

