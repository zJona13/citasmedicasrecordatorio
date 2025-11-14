/**
 * Controlador del chatbot para agendamiento de citas
 */
import { pool } from '../db.js';
import { 
  procesarMensaje, 
  obtenerEspecialidades, 
  obtenerProfesionales,
  obtenerEstadoSesion,
  limpiarSesion
} from '../services/chatbot.js';
import { calcularDisponibilidadSemanal } from '../utils/availability.js';
import { verificarHorarioCita } from '../utils/horarios.js';

/**
 * POST /api/chatbot/message
 * Procesa un mensaje del usuario en el chatbot
 */
export const procesarMensajeChatbot = async (req, res) => {
  try {
    const { sessionId, message, dni, nombre, telefono } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId y message son requeridos' });
    }

    // Si se proporcionan datos del paciente, guardarlos en la sesión
    const sesion = obtenerEstadoSesion(sessionId);
    if (sesion) {
      if (dni) sesion.datos.dni = dni;
      if (nombre) sesion.datos.nombre = nombre;
      if (telefono) sesion.datos.telefono = telefono;
    }

    // Procesar el mensaje
    let respuesta = await procesarMensaje(sessionId, message);

    // Si estamos en estado de recolección de datos, manejar el flujo
    if (sesion && sesion.datos.pendienteDatos && sesion.datos.pendienteDatos.length > 0) {
      const datoPendiente = sesion.datos.pendienteDatos[0];
      
      if (datoPendiente === 'dni' && !sesion.datos.dni) {
        // Esperando DNI
        if (/^\d{8}$/.test(message.trim())) {
          sesion.datos.dni = message.trim();
          sesion.datos.pendienteDatos.shift();
          respuesta.mensaje = '2. ¿Cuál es su nombre completo?';
        } else {
          respuesta.mensaje = 'Por favor, ingrese un DNI válido (8 dígitos).';
        }
      } else if (datoPendiente === 'nombre' && !sesion.datos.nombre) {
        // Esperando nombre
        if (message.trim().length >= 3) {
          sesion.datos.nombre = message.trim();
          sesion.datos.pendienteDatos.shift();
          respuesta.mensaje = '3. ¿Cuál es su número de teléfono?';
        } else {
          respuesta.mensaje = 'Por favor, ingrese su nombre completo.';
        }
      } else if (datoPendiente === 'telefono' && !sesion.datos.telefono) {
        // Esperando teléfono
        const telefonoLimpio = message.trim().replace(/\D/g, '');
        if (telefonoLimpio.length >= 9) {
          sesion.datos.telefono = telefonoLimpio;
          sesion.datos.pendienteDatos.shift();
          
          // Si es lista de espera, crear entrada
          if (sesion.datos.esListaEspera) {
            try {
              // Buscar o crear paciente
              let [pacienteRows] = await pool.execute(
                `SELECT id FROM pacientes WHERE dni = ?`,
                [sesion.datos.dni]
              );
              
              let pacienteId;
              if (pacienteRows.length > 0) {
                pacienteId = pacienteRows[0].id;
                // Actualizar datos
                await pool.execute(
                  `UPDATE pacientes SET nombre_completo = ?, telefono = ? WHERE id = ?`,
                  [sesion.datos.nombre, sesion.datos.telefono, pacienteId]
                );
              } else {
                const [result] = await pool.execute(
                  `INSERT INTO pacientes (dni, nombre_completo, telefono, estado) VALUES (?, ?, ?, 'activo')`,
                  [sesion.datos.dni, sesion.datos.nombre, sesion.datos.telefono]
                );
                pacienteId = result.insertId;
              }
              
              // Crear entrada en lista de espera
              await pool.execute(
                `INSERT INTO lista_espera (paciente_id, especialidad_id, profesional_id, canal_preferido) 
                 VALUES (?, ?, ?, 'SMS')`,
                [
                  pacienteId,
                  sesion.datos.especialidadId,
                  sesion.datos.profesionalId || null
                ]
              );
              
              respuesta.mensaje = '¡Perfecto! Ha sido agregado a la lista de espera. Le notificaremos cuando haya disponibilidad. ¡Gracias!';
              respuesta.finalizado = true;
              limpiarSesion(sessionId);
            } catch (error) {
              console.error('Error creando lista de espera:', error);
              respuesta.mensaje = 'Hubo un error al agregarlo a la lista de espera. Por favor, intente nuevamente.';
            }
          } else {
            // Crear cita
            try {
              const fecha = sesion.datos.fechaSeleccionada;
              const hora = sesion.datos.horaSeleccionada + ':00';
              const profesionalId = sesion.datos.profesionalId;
              
              // Validar que el profesional existe
              const [profesionalRows] = await pool.execute(
                `SELECT id, estado, horario FROM profesionales WHERE id = ?`,
                [profesionalId]
              );
              
              if (profesionalRows.length === 0) {
                throw new Error('Profesional no encontrado');
              }
              
              if (profesionalRows[0].estado !== 'disponible') {
                throw new Error('El profesional no está disponible');
              }
              
              // Validar horario
              const validacionHorario = verificarHorarioCita(fecha, hora, profesionalRows[0].horario);
              if (!validacionHorario.dentroHorario) {
                throw new Error('El horario seleccionado está fuera del horario del profesional');
              }
              
              // Buscar o crear paciente
              let [pacienteRows] = await pool.execute(
                `SELECT id FROM pacientes WHERE dni = ?`,
                [sesion.datos.dni]
              );
              
              let pacienteId;
              if (pacienteRows.length > 0) {
                pacienteId = pacienteRows[0].id;
                await pool.execute(
                  `UPDATE pacientes SET nombre_completo = ?, telefono = ? WHERE id = ?`,
                  [sesion.datos.nombre, sesion.datos.telefono, pacienteId]
                );
              } else {
                const [result] = await pool.execute(
                  `INSERT INTO pacientes (dni, nombre_completo, telefono, estado) VALUES (?, ?, ?, 'activo')`,
                  [sesion.datos.dni, sesion.datos.nombre, sesion.datos.telefono]
                );
                pacienteId = result.insertId;
              }
              
              // Validar que no haya conflicto
              const [conflictos] = await pool.execute(
                `SELECT id FROM citas 
                 WHERE profesional_id = ? 
                 AND fecha = ? 
                 AND hora = ? 
                 AND estado IN ('pendiente', 'confirmada')`,
                [profesionalId, fecha, hora]
              );
              
              if (conflictos.length > 0) {
                throw new Error('Ya existe una cita en ese horario');
              }
              
              // Crear la cita
              await pool.execute(
                `INSERT INTO citas (paciente_id, profesional_id, fecha, hora, estado) 
                 VALUES (?, ?, ?, ?, 'pendiente')`,
                [pacienteId, profesionalId, fecha, hora]
              );
              
              respuesta.mensaje = `¡Excelente! Su cita ha sido reservada para el ${new Date(fecha).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${hora.substring(0, 5)}. Recibirá un recordatorio 24 horas antes. ¡Gracias!`;
              respuesta.finalizado = true;
              limpiarSesion(sessionId);
            } catch (error) {
              console.error('Error creando cita:', error);
              respuesta.mensaje = error.message || 'Hubo un error al crear la cita. Por favor, intente nuevamente.';
            }
          }
        } else {
          respuesta.mensaje = 'Por favor, ingrese un número de teléfono válido (mínimo 9 dígitos).';
        }
      }
    }

    res.json(respuesta);
  } catch (error) {
    console.error('Error procesando mensaje del chatbot:', error);
    res.status(500).json({ error: 'Error al procesar el mensaje' });
  }
};

/**
 * GET /api/chatbot/specialties
 * Obtiene las especialidades disponibles
 */
export const obtenerEspecialidadesChatbot = async (req, res) => {
  try {
    const especialidades = await obtenerEspecialidades();
    res.json(especialidades);
  } catch (error) {
    console.error('Error obteniendo especialidades:', error);
    res.status(500).json({ error: 'Error al obtener especialidades' });
  }
};

/**
 * GET /api/chatbot/professionals/:specialtyId
 * Obtiene los profesionales de una especialidad
 */
export const obtenerProfesionalesChatbot = async (req, res) => {
  try {
    const { specialtyId } = req.params;
    const profesionales = await obtenerProfesionales(parseInt(specialtyId, 10));
    res.json(profesionales);
  } catch (error) {
    console.error('Error obteniendo profesionales:', error);
    res.status(500).json({ error: 'Error al obtener profesionales' });
  }
};

/**
 * GET /api/chatbot/availability/:professionalId
 * Obtiene la disponibilidad de un profesional
 */
export const obtenerDisponibilidadChatbot = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { fechaInicio } = req.query;
    
    const fecha = fechaInicio || new Date().toISOString().split('T')[0];
    const disponibilidad = await calcularDisponibilidadSemanal(parseInt(professionalId, 10), fecha);
    
    res.json(disponibilidad);
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
};

/**
 * POST /api/chatbot/appointment
 * Crea una cita desde el chatbot
 */
export const crearCitaChatbot = async (req, res) => {
  try {
    const { dni, nombre_completo, telefono, profesional_id, fecha, hora } = req.body;
    
    if (!dni || !nombre_completo || !profesional_id || !fecha || !hora) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Validar profesional
    const [profesionalRows] = await pool.execute(
      `SELECT id, estado, horario FROM profesionales WHERE id = ?`,
      [profesional_id]
    );
    
    if (profesionalRows.length === 0) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    
    if (profesionalRows[0].estado !== 'disponible') {
      return res.status(400).json({ error: 'El profesional no está disponible' });
    }
    
    // Validar horario
    const validacionHorario = verificarHorarioCita(fecha, hora, profesionalRows[0].horario);
    if (!validacionHorario.dentroHorario) {
      return res.status(400).json({ error: 'El horario está fuera del horario del profesional' });
    }
    
    // Buscar o crear paciente
    let [pacienteRows] = await pool.execute(
      `SELECT id FROM pacientes WHERE dni = ?`,
      [dni]
    );
    
    let pacienteId;
    if (pacienteRows.length > 0) {
      pacienteId = pacienteRows[0].id;
      if (nombre_completo || telefono) {
        const updateFields = [];
        const updateParams = [];
        if (nombre_completo) {
          updateFields.push('nombre_completo = ?');
          updateParams.push(nombre_completo);
        }
        if (telefono) {
          updateFields.push('telefono = ?');
          updateParams.push(telefono);
        }
        if (updateFields.length > 0) {
          updateParams.push(pacienteId);
          await pool.execute(
            `UPDATE pacientes SET ${updateFields.join(', ')} WHERE id = ?`,
            updateParams
          );
        }
      }
    } else {
      const [result] = await pool.execute(
        `INSERT INTO pacientes (dni, nombre_completo, telefono, estado) VALUES (?, ?, ?, 'activo')`,
        [dni, nombre_completo, telefono || null]
      );
      pacienteId = result.insertId;
    }
    
    // Validar conflicto
    const [conflictos] = await pool.execute(
      `SELECT id FROM citas 
       WHERE profesional_id = ? 
       AND fecha = ? 
       AND hora = ? 
       AND estado IN ('pendiente', 'confirmada')`,
      [profesional_id, fecha, hora]
    );
    
    if (conflictos.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cita en ese horario' });
    }
    
    // Crear cita
    const [result] = await pool.execute(
      `INSERT INTO citas (paciente_id, profesional_id, fecha, hora, estado) 
       VALUES (?, ?, ?, ?, 'pendiente')`,
      [pacienteId, profesional_id, fecha, hora]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: 'Cita creada exitosamente'
    });
  } catch (error) {
    console.error('Error creando cita desde chatbot:', error);
    res.status(500).json({ error: 'Error al crear la cita' });
  }
};

/**
 * POST /api/chatbot/waiting-list
 * Agrega un paciente a la lista de espera desde el chatbot
 */
export const agregarListaEsperaChatbot = async (req, res) => {
  try {
    const { dni, nombre_completo, telefono, especialidad_id, profesional_id, canal_preferido } = req.body;
    
    if (!dni || !nombre_completo || !especialidad_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos: dni, nombre_completo, especialidad_id' });
    }

    // Buscar o crear paciente
    let [pacienteRows] = await pool.execute(
      `SELECT id FROM pacientes WHERE dni = ?`,
      [dni]
    );
    
    let pacienteId;
    if (pacienteRows.length > 0) {
      pacienteId = pacienteRows[0].id;
      // Actualizar datos
      if (nombre_completo || telefono) {
        const updateFields = [];
        const updateParams = [];
        
        if (nombre_completo) {
          updateFields.push('nombre_completo = ?');
          updateParams.push(nombre_completo);
        }
        if (telefono) {
          updateFields.push('telefono = ?');
          updateParams.push(telefono);
        }
        
        if (updateFields.length > 0) {
          updateParams.push(pacienteId);
          await pool.execute(
            `UPDATE pacientes SET ${updateFields.join(', ')} WHERE id = ?`,
            updateParams
          );
        }
      }
    } else {
      const [result] = await pool.execute(
        `INSERT INTO pacientes (dni, nombre_completo, telefono, estado) VALUES (?, ?, ?, 'activo')`,
        [dni, nombre_completo, telefono || null]
      );
      pacienteId = result.insertId;
    }
    
    // Crear entrada en lista de espera
    const [result] = await pool.execute(
      `INSERT INTO lista_espera (paciente_id, especialidad_id, profesional_id, canal_preferido) 
       VALUES (?, ?, ?, ?)`,
      [
        pacienteId,
        especialidad_id,
        profesional_id || null,
        canal_preferido || 'SMS'
      ]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: 'Paciente agregado a la lista de espera exitosamente'
    });
  } catch (error) {
    console.error('Error agregando a lista de espera:', error);
    res.status(500).json({ error: 'Error al agregar a la lista de espera' });
  }
};

