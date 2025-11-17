/**
 * Servicio de chatbot para agendamiento de citas
 * Maneja el flujo conversacional y estado de sesión
 */
import { pool } from '../db.js';
import { calcularDisponibilidadSemanal, estaSemanaCompleta, obtenerSiguienteSemanaDisponible } from '../utils/availability.js';
import { obtenerConfiguracion } from './configuraciones.js';

// Almacenamiento de sesiones en memoria (Map)
const sesiones = new Map();

const SESSION_TIMEOUT = parseInt(process.env.CHATBOT_SESSION_TIMEOUT || '3600000', 10); // 1 hora por defecto

/**
 * Estados del flujo conversacional
 */
const ESTADOS = {
  INICIO: 'inicio',
  ESPECIALIDAD: 'especialidad',
  PROFESIONAL: 'profesional',
  DISPONIBILIDAD: 'disponibilidad',
  CONFIRMACION_CITA: 'confirmacion_cita',
  LISTA_ESPERA: 'lista_espera',
  TELEFONO: 'telefono',
  FINALIZADO: 'finalizado'
};

/**
 * Limpia sesiones expiradas
 */
function limpiarSesionesExpiradas() {
  const ahora = Date.now();
  for (const [sessionId, sesion] of sesiones.entries()) {
    if (ahora - sesion.ultimaActividad > SESSION_TIMEOUT) {
      sesiones.delete(sessionId);
    }
  }
}

// Limpiar sesiones cada 5 minutos
setInterval(limpiarSesionesExpiradas, 5 * 60 * 1000);

/**
 * Obtiene o crea una sesión
 * @param {string} sessionId - ID de la sesión
 * @returns {Object} Sesión
 */
function obtenerSesion(sessionId) {
  if (!sesiones.has(sessionId)) {
    sesiones.set(sessionId, {
      estado: ESTADOS.INICIO,
      datos: {},
      ultimaActividad: Date.now()
    });
  }
  
  const sesion = sesiones.get(sessionId);
  sesion.ultimaActividad = Date.now();
  return sesion;
}

/**
 * Obtiene las especialidades disponibles
 * @returns {Promise<Array>}
 */
export async function obtenerEspecialidades() {
  const [rows] = await pool.execute(
    `SELECT id, nombre FROM especialidades WHERE activo = 1 ORDER BY nombre ASC`
  );
  return rows;
}

/**
 * Obtiene los profesionales de una especialidad
 * @param {number} especialidadId - ID de la especialidad
 * @returns {Promise<Array>}
 */
export async function obtenerProfesionales(especialidadId) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.nombre_completo, p.consultorio, e.nombre as especialidad
     FROM profesionales p
     INNER JOIN especialidades e ON p.especialidad_id = e.id
     WHERE p.especialidad_id = ? AND p.estado = 'disponible'
     ORDER BY p.nombre_completo ASC`,
    [especialidadId]
  );
  return rows;
}

/**
 * Procesa un mensaje del usuario
 * @param {string} sessionId - ID de la sesión
 * @param {string} mensaje - Mensaje del usuario
 * @returns {Promise<Object>} Respuesta del bot
 */
export async function procesarMensaje(sessionId, mensaje) {
  // Verificar si el chatbot está habilitado
  const chatbotEnabled = await obtenerConfiguracion('chatbot_enabled');
  if (!chatbotEnabled) {
    return {
      mensaje: 'Lo siento, el chatbot está temporalmente deshabilitado. Por favor, contacte con el centro médico directamente.',
      opciones: [],
      estado: 'finalizado',
      finalizado: true
    };
  }

  const sesion = obtenerSesion(sessionId);
  const mensajeNormalizado = mensaje.trim().toLowerCase();
  
  let respuesta = {
    mensaje: '',
    opciones: [],
    estado: sesion.estado,
    finalizado: false
  };

  switch (sesion.estado) {
    case ESTADOS.INICIO:
      // Obtener mensaje de bienvenida desde configuraciones
      const greeting = await obtenerConfiguracion('chatbot_greeting');
      
      if (mensajeNormalizado.includes('cita') || mensajeNormalizado.includes('agendar') || mensajeNormalizado.includes('reservar')) {
        const especialidades = await obtenerEspecialidades();
        if (especialidades.length === 0) {
          respuesta.mensaje = 'Lo siento, no hay especialidades disponibles en este momento.';
          respuesta.finalizado = true;
        } else {
          sesion.estado = ESTADOS.ESPECIALIDAD;
          sesion.datos.especialidades = especialidades;
          respuesta.mensaje = '¡Perfecto! Para agendar su cita, necesito algunos datos.\n\n¿Qué especialidad necesita?';
          respuesta.opciones = especialidades.map(e => ({ id: e.id, texto: e.nombre }));
        }
      } else {
        respuesta.mensaje = greeting || 'Hola! ¿En qué puedo ayudarle? Puede escribir "cita" o "agendar" para comenzar a reservar una cita médica.';
      }
      break;

    case ESTADOS.ESPECIALIDAD:
      // Buscar especialidad por nombre o ID
      const especialidadSeleccionada = sesion.datos.especialidades.find(
        e => e.id.toString() === mensajeNormalizado || 
             e.nombre.toLowerCase().includes(mensajeNormalizado) ||
             mensajeNormalizado.includes(e.nombre.toLowerCase())
      );
      
      if (especialidadSeleccionada) {
        const profesionales = await obtenerProfesionales(especialidadSeleccionada.id);
        if (profesionales.length === 0) {
          respuesta.mensaje = `Lo siento, no hay profesionales disponibles para ${especialidadSeleccionada.nombre} en este momento.`;
          respuesta.finalizado = true;
          sesion.estado = ESTADOS.FINALIZADO;
        } else {
          sesion.estado = ESTADOS.PROFESIONAL;
          sesion.datos.especialidadId = especialidadSeleccionada.id;
          sesion.datos.especialidadNombre = especialidadSeleccionada.nombre;
          sesion.datos.profesionales = profesionales;
          respuesta.mensaje = `Excelente. ¿Con qué profesional desea atenderse?`;
          respuesta.opciones = profesionales.map(p => ({ 
            id: p.id, 
            texto: `${p.nombre_completo}${p.consultorio ? ' - ' + p.consultorio : ''}` 
          }));
        }
      } else {
        respuesta.mensaje = 'No reconocí esa especialidad. Por favor, seleccione una de las opciones disponibles.';
        respuesta.opciones = sesion.datos.especialidades.map(e => ({ id: e.id, texto: e.nombre }));
      }
      break;

    case ESTADOS.PROFESIONAL:
      // Buscar profesional por nombre o ID
      const profesionalSeleccionado = sesion.datos.profesionales.find(
        p => p.id.toString() === mensajeNormalizado ||
             p.nombre_completo.toLowerCase().includes(mensajeNormalizado) ||
             mensajeNormalizado.includes(p.nombre_completo.toLowerCase())
      );
      
      if (profesionalSeleccionado) {
        sesion.estado = ESTADOS.DISPONIBILIDAD;
        sesion.datos.profesionalId = profesionalSeleccionado.id;
        sesion.datos.profesionalNombre = profesionalSeleccionado.nombre_completo;
        
        // Calcular disponibilidad de la semana actual
        const hoy = new Date();
        const fechaInicio = hoy.toISOString().split('T')[0];
        const disponibilidad = await calcularDisponibilidadSemanal(profesionalSeleccionado.id, fechaInicio);
        
        sesion.datos.disponibilidad = disponibilidad;
        
        if (disponibilidad.resumen.semanaCompleta) {
          // Verificar semana siguiente
          const siguienteSemana = await obtenerSiguienteSemanaDisponible(profesionalSeleccionado.id, fechaInicio);
          if (siguienteSemana && !siguienteSemana.resumen.semanaCompleta) {
            respuesta.mensaje = `La semana actual está completamente ocupada. La siguiente semana tiene disponibilidad. ¿Desea ver esos horarios o prefiere unirse a la lista de espera?`;
            sesion.datos.siguienteSemana = siguienteSemana;
            respuesta.opciones = [
              { id: 'ver_siguiente', texto: 'Ver horarios de la próxima semana' },
              { id: 'lista_espera', texto: 'Unirme a la lista de espera' }
            ];
          } else {
            respuesta.mensaje = `La semana actual y la siguiente están completamente ocupadas. ¿Desea unirse a la lista de espera para ser notificado cuando haya disponibilidad?`;
            respuesta.opciones = [
              { id: 'lista_espera', texto: 'Sí, unirme a la lista de espera' },
              { id: 'cancelar', texto: 'No, cancelar' }
            ];
            sesion.estado = ESTADOS.LISTA_ESPERA;
          }
        } else {
          // Hay disponibilidad, mostrar horarios
          const diasDisponibles = Object.entries(disponibilidad.disponibilidad)
            .filter(([_, info]) => info.disponible)
            .map(([fecha, info]) => ({
              fecha,
              dia: info.dia,
              slots: info.slots
            }));
          
          if (diasDisponibles.length > 0) {
            let mensajeDisponibilidad = `Horarios disponibles para el Dr./Dra. ${profesionalSeleccionado.nombre_completo}:\n\n`;
            diasDisponibles.forEach(({ fecha, dia, slots }) => {
              const fechaFormateada = new Date(fecha).toLocaleDateString('es-PE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              });
              mensajeDisponibilidad += `${fechaFormateada}: ${slots.join(', ')}\n`;
            });
            mensajeDisponibilidad += '\n¿Cuál horario prefiere? (Ejemplo: "2024-12-15 10:00")';
            respuesta.mensaje = mensajeDisponibilidad;
            sesion.datos.diasDisponibles = diasDisponibles;
          } else {
            respuesta.mensaje = 'No hay horarios disponibles en este momento. ¿Desea unirse a la lista de espera?';
            respuesta.opciones = [
              { id: 'lista_espera', texto: 'Sí, unirme a la lista de espera' },
              { id: 'cancelar', texto: 'No, cancelar' }
            ];
            sesion.estado = ESTADOS.LISTA_ESPERA;
          }
        }
      } else {
        respuesta.mensaje = 'No reconocí ese profesional. Por favor, seleccione uno de la lista.';
        respuesta.opciones = sesion.datos.profesionales.map(p => ({ 
          id: p.id, 
          texto: `${p.nombre_completo}${p.consultorio ? ' - ' + p.consultorio : ''}` 
        }));
      }
      break;

    case ESTADOS.DISPONIBILIDAD:
      // Procesar selección de horario o respuesta sobre lista de espera
      if (mensajeNormalizado === 'ver_siguiente' || mensajeNormalizado.includes('siguiente')) {
        if (sesion.datos.siguienteSemana) {
          const diasDisponibles = Object.entries(sesion.datos.siguienteSemana.disponibilidad)
            .filter(([_, info]) => info.disponible)
            .map(([fecha, info]) => ({
              fecha,
              dia: info.dia,
              slots: info.slots
            }));
          
          let mensajeDisponibilidad = `Horarios disponibles para la próxima semana:\n\n`;
          diasDisponibles.forEach(({ fecha, dia, slots }) => {
            const fechaFormateada = new Date(fecha).toLocaleDateString('es-PE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            });
            mensajeDisponibilidad += `${fechaFormateada}: ${slots.join(', ')}\n`;
          });
          mensajeDisponibilidad += '\n¿Cuál horario prefiere? (Ejemplo: "2024-12-22 10:00")';
          respuesta.mensaje = mensajeDisponibilidad;
          sesion.datos.diasDisponibles = diasDisponibles;
        }
      } else if (mensajeNormalizado === 'lista_espera' || mensajeNormalizado.includes('lista') || mensajeNormalizado.includes('espera')) {
        sesion.estado = ESTADOS.TELEFONO;
        respuesta.mensaje = 'Perfecto. Para agregarlo a la lista de espera, necesito su número de teléfono. ¿Cuál es su número?';
      } else if (mensajeNormalizado === 'cancelar' || mensajeNormalizado.includes('no') || mensajeNormalizado.includes('salir')) {
        respuesta.mensaje = 'Entendido. Si cambia de opinión, puede volver a iniciar el proceso. ¡Que tenga un buen día!';
        respuesta.finalizado = true;
        sesion.estado = ESTADOS.FINALIZADO;
      } else {
        // Intentar parsear fecha y hora
        const partes = mensajeNormalizado.split(/\s+/);
        if (partes.length >= 2) {
          const fecha = partes[0];
          const hora = partes[1];
          
          // Validar formato de fecha (YYYY-MM-DD) y hora (HH:MM)
          if (/^\d{4}-\d{2}-\d{2}$/.test(fecha) && /^\d{2}:\d{2}$/.test(hora)) {
            // Verificar que el horario esté disponible
            const diaDisponible = sesion.datos.diasDisponibles?.find(d => d.fecha === fecha);
            if (diaDisponible && diaDisponible.slots.includes(hora)) {
              sesion.datos.fechaSeleccionada = fecha;
              sesion.datos.horaSeleccionada = hora;
              sesion.estado = ESTADOS.CONFIRMACION_CITA;
              respuesta.mensaje = `Perfecto. ¿Confirma la cita para el ${new Date(fecha).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${hora}?`;
              respuesta.opciones = [
                { id: 'confirmar', texto: 'Sí, confirmar' },
                { id: 'cancelar', texto: 'No, cancelar' }
              ];
            } else {
              respuesta.mensaje = 'Ese horario no está disponible. Por favor, seleccione uno de los horarios mostrados.';
            }
          } else {
            respuesta.mensaje = 'Por favor, ingrese la fecha y hora en el formato: YYYY-MM-DD HH:MM (ejemplo: 2024-12-15 10:00)';
          }
        } else {
          respuesta.mensaje = 'Por favor, ingrese la fecha y hora en el formato: YYYY-MM-DD HH:MM (ejemplo: 2024-12-15 10:00)';
        }
      }
      break;

    case ESTADOS.CONFIRMACION_CITA:
      if (mensajeNormalizado.includes('si') || mensajeNormalizado.includes('confirmar') || mensajeNormalizado === 's') {
        sesion.estado = ESTADOS.TELEFONO;
        respuesta.mensaje = 'Excelente. Para completar la reserva, necesito algunos datos:\n\n1. ¿Cuál es su número de DNI?';
        sesion.datos.pendienteDatos = ['dni', 'nombre', 'telefono'];
      } else if (mensajeNormalizado.includes('no') || mensajeNormalizado.includes('cancelar') || mensajeNormalizado === 'n') {
        respuesta.mensaje = 'Reserva cancelada. ¿Desea seleccionar otro horario?';
        sesion.estado = ESTADOS.DISPONIBILIDAD;
      } else {
        respuesta.mensaje = 'Por favor, responda "Sí" para confirmar o "No" para cancelar.';
        respuesta.opciones = [
          { id: 'confirmar', texto: 'Sí, confirmar' },
          { id: 'cancelar', texto: 'No, cancelar' }
        ];
      }
      break;

    case ESTADOS.TELEFONO:
      // Este estado se maneja en el controlador después de obtener los datos
      break;

    case ESTADOS.LISTA_ESPERA:
      if (mensajeNormalizado.includes('si') || mensajeNormalizado.includes('unirme') || mensajeNormalizado === 's') {
        sesion.estado = ESTADOS.TELEFONO;
        respuesta.mensaje = 'Perfecto. Para agregarlo a la lista de espera, necesito algunos datos:\n\n1. ¿Cuál es su número de DNI?';
        sesion.datos.pendienteDatos = ['dni', 'nombre', 'telefono'];
        sesion.datos.esListaEspera = true;
      } else {
        respuesta.mensaje = 'Entendido. Si cambia de opinión, puede volver a iniciar el proceso. ¡Que tenga un buen día!';
        respuesta.finalizado = true;
        sesion.estado = ESTADOS.FINALIZADO;
      }
      break;

    default:
      respuesta.mensaje = 'Lo siento, no entendí. ¿Desea agendar una cita?';
      sesion.estado = ESTADOS.INICIO;
  }

  respuesta.estado = sesion.estado;
  return respuesta;
}

/**
 * Obtiene el estado actual de una sesión
 * @param {string} sessionId - ID de la sesión
 * @returns {Object|null}
 */
export function obtenerEstadoSesion(sessionId) {
  if (!sesiones.has(sessionId)) {
    return null;
  }
  return sesiones.get(sessionId);
}

/**
 * Limpia una sesión
 * @param {string} sessionId - ID de la sesión
 */
export function limpiarSesion(sessionId) {
  sesiones.delete(sessionId);
}

