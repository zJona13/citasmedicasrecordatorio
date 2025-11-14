import { pool } from '../db.js';
import { verificarHorarioCita } from '../utils/horarios.js';
import { enviarConfirmacionManual } from '../services/messaging.js';
import { notificarListaEsperaPorCitaCancelada } from '../services/notifications.js';

// GET /api/citas
export const getCitas = async (req, res) => {
  try {
    const { fecha, fecha_inicio, fecha_fin, profesional_id } = req.query;
    
    let query = `
      SELECT 
        c.id,
        TIME(c.hora) as time,
        pa.nombre_completo as patient,
        pa.dni,
        pa.telefono,
        pa.email,
        pr.nombre_completo as doctor,
        pr.id as profesional_id,
        e.nombre as specialty,
        c.estado as status,
        DATE_FORMAT(c.fecha, '%Y-%m-%d') as fecha,
        c.hora,
        c.notas,
        c.es_excepcional,
        c.razon_excepcional,
        c.razon_adicional
      FROM citas c
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      INNER JOIN profesionales pr ON c.profesional_id = pr.id
      INNER JOIN especialidades e ON pr.especialidad_id = e.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Soporte para fecha única (compatibilidad hacia atrás)
    if (fecha) {
      query += ` AND c.fecha = ?`;
      params.push(fecha);
    }
    
    // Soporte para rango de fechas
    if (fecha_inicio && fecha_fin) {
      query += ` AND c.fecha >= ? AND c.fecha <= ?`;
      params.push(fecha_inicio, fecha_fin);
    } else if (fecha_inicio) {
      query += ` AND c.fecha >= ?`;
      params.push(fecha_inicio);
    } else if (fecha_fin) {
      query += ` AND c.fecha <= ?`;
      params.push(fecha_fin);
    }
    
    // Si no se proporciona ninguna fecha, usar la fecha de hoy
    if (!fecha && !fecha_inicio && !fecha_fin) {
      const fechaHoy = new Date().toISOString().split('T')[0];
      query += ` AND c.fecha = ?`;
      params.push(fechaHoy);
    }
    
    if (profesional_id) {
      query += ` AND c.profesional_id = ?`;
      params.push(profesional_id);
    }
    
    query += ` ORDER BY c.fecha ASC, c.hora ASC`;
    
    const [rows] = await pool.execute(query, params);
    
    // Obtener información de confirmaciones para cada cita
    const citas = await Promise.all(rows.map(async (cita) => {
      const [confirmaciones] = await pool.execute(
        `SELECT canal, estado_envio, respuesta FROM confirmaciones WHERE cita_id = ? ORDER BY fecha_envio DESC LIMIT 1`,
        [cita.id]
      );
      
      let channel = null;
      if (confirmaciones.length > 0) {
        channel = confirmaciones[0].canal;
      }
      
      // Mapear estado de la base de datos al formato esperado por el frontend
      let status = 'pending';
      if (cita.status === 'confirmada') {
        status = 'confirmed';
      } else if (cita.status === 'cancelada') {
        status = 'released';
      } else if (cita.status === 'no_show') {
        status = 'offered';
      }
      
      return {
        id: cita.id.toString(),
        time: cita.time.substring(0, 5), // Formato HH:MM
        patient: cita.patient,
        dni: cita.dni,
        phone: cita.telefono,
        email: cita.email,
        doctor: cita.doctor,
        profesional_id: cita.profesional_id,
        specialty: cita.specialty,
        status: status,
        channel: channel || 'App',
        fecha: cita.fecha,
        hora: cita.hora,
        notas: cita.notas,
        es_excepcional: cita.es_excepcional || false,
        razon_excepcional: cita.razon_excepcional,
        razon_adicional: cita.razon_adicional,
      };
    }));

    res.json(citas);
  } catch (error) {
    console.error('Error getting citas:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// POST /api/citas
export const createCita = async (req, res) => {
  try {
    const { dni, nombre_completo, telefono, email, profesional_id, fecha, hora, notas, es_excepcional, razon_excepcional, razon_adicional } = req.body;
    
    // Validaciones básicas
    if (!dni || !nombre_completo || !profesional_id || !fecha || !hora) {
      return res.status(400).json({ error: 'Faltan campos requeridos: dni, nombre_completo, profesional_id, fecha, hora' });
    }
    
    // Validar que el profesional existe y está disponible
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
    
    // Validar horario de la cita
    const horarioProfesional = profesionalRows[0].horario;
    const validacionHorario = verificarHorarioCita(fecha, hora, horarioProfesional);
    
    // Si la cita está fuera del horario, se requiere marcar como excepcional
    if (!validacionHorario.dentroHorario) {
      if (!es_excepcional || !razon_excepcional) {
        const diaCapitalizado = validacionHorario.dia ? validacionHorario.dia.charAt(0).toUpperCase() + validacionHorario.dia.slice(1) : 'ese día';
        const mensajeHorario = validacionHorario.horarioDia 
          ? `${diaCapitalizado}: ${validacionHorario.horarioDia.inicio}-${validacionHorario.horarioDia.fin}`
          : `${diaCapitalizado} no tiene horario configurado`;
        
        return res.status(400).json({ 
          error: `La cita está fuera del horario del profesional (${mensajeHorario}). Debe marcar esta cita como excepcional y proporcionar una razón.`,
          fueraHorario: true,
          horarioProfesional: validacionHorario
        });
      }
    }
    
    // Buscar o crear paciente
    let [pacienteRows] = await pool.execute(
      `SELECT id FROM pacientes WHERE dni = ?`,
      [dni]
    );
    
    let pacienteId;
    if (pacienteRows.length > 0) {
      pacienteId = pacienteRows[0].id;
      // Actualizar datos del paciente si se proporcionan
      if (nombre_completo || telefono || email) {
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
        if (email) {
          updateFields.push('email = ?');
          updateParams.push(email);
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
      // Crear nuevo paciente
      const [result] = await pool.execute(
        `INSERT INTO pacientes (dni, nombre_completo, telefono, email, estado) VALUES (?, ?, ?, ?, 'activo')`,
        [dni, nombre_completo, telefono || null, email || null]
      );
      pacienteId = result.insertId;
    }
    
    // Validar que no haya conflicto de horarios
    const [conflictos] = await pool.execute(
      `SELECT id FROM citas 
       WHERE profesional_id = ? 
       AND fecha = ? 
       AND hora = ? 
       AND estado IN ('pendiente', 'confirmada')`,
      [profesional_id, fecha, hora]
    );
    
    if (conflictos.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cita en ese horario para este profesional' });
    }
    
    // Crear la cita
    const [result] = await pool.execute(
      `INSERT INTO citas (paciente_id, profesional_id, fecha, hora, estado, notas, es_excepcional, razon_excepcional, razon_adicional) 
       VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?, ?)`,
      [
        pacienteId, 
        profesional_id, 
        fecha, 
        hora, 
        notas || null,
        es_excepcional || false,
        razon_excepcional || null,
        razon_adicional || null
      ]
    );
    
    // Obtener la cita creada con toda su información
    const [citaRows] = await pool.execute(
      `SELECT 
        c.id,
        TIME(c.hora) as time,
        pa.nombre_completo as patient,
        pa.dni,
        pa.telefono,
        pa.email,
        pr.nombre_completo as doctor,
        e.nombre as specialty,
        c.estado as status,
        DATE_FORMAT(c.fecha, '%Y-%m-%d') as fecha,
        c.hora,
        c.notas,
        c.es_excepcional,
        c.razon_excepcional,
        c.razon_adicional
      FROM citas c
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      INNER JOIN profesionales pr ON c.profesional_id = pr.id
      INNER JOIN especialidades e ON pr.especialidad_id = e.id
      WHERE c.id = ?`,
      [result.insertId]
    );
    
    const cita = citaRows[0];
    
    res.status(201).json({
      id: cita.id.toString(),
      time: cita.time.substring(0, 5),
      patient: cita.patient,
      dni: cita.dni,
      phone: cita.telefono,
      email: cita.email,
      doctor: cita.doctor,
      profesional_id: profesional_id,
      specialty: cita.specialty,
      status: 'pending',
      channel: 'App',
      fecha: cita.fecha,
      hora: cita.hora,
      notas: cita.notas,
      es_excepcional: cita.es_excepcional || false,
      razon_excepcional: cita.razon_excepcional,
      razon_adicional: cita.razon_adicional,
    });
  } catch (error) {
    console.error('Error creating cita:', error);
    
    // Manejar errores de duplicado de DNI
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('dni')) {
      return res.status(409).json({ error: 'Ya existe un paciente con ese DNI' });
    }
    
    res.status(500).json({ error: 'Error al crear la cita' });
  }
};

// PUT /api/citas/:id - Reagendar cita
export const updateCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { profesional_id, fecha, hora, es_excepcional, razon_excepcional, razon_adicional } = req.body;
    
    // Validaciones básicas
    if (!fecha || !hora) {
      return res.status(400).json({ error: 'Faltan campos requeridos: fecha, hora' });
    }
    
    // Validar que la cita existe
    const [citaRows] = await pool.execute(
      `SELECT c.*, pa.telefono, pr.nombre_completo as doctor, e.nombre as specialty
       FROM citas c
       INNER JOIN pacientes pa ON c.paciente_id = pa.id
       INNER JOIN profesionales pr ON c.profesional_id = pr.id
       INNER JOIN especialidades e ON pr.especialidad_id = e.id
       WHERE c.id = ?`,
      [id]
    );
    
    if (citaRows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    const citaActual = citaRows[0];
    const profesionalIdNuevo = profesional_id || citaActual.profesional_id;
    
    // Validar que la nueva fecha/hora no esté en el pasado
    const fechaHoraCita = new Date(`${fecha}T${hora}`);
    const ahora = new Date();
    if (fechaHoraCita < ahora) {
      return res.status(400).json({ error: 'No se puede reagendar una cita al pasado' });
    }
    
    // Validar que el profesional existe y está disponible
    const [profesionalRows] = await pool.execute(
      `SELECT id, estado, horario FROM profesionales WHERE id = ?`,
      [profesionalIdNuevo]
    );
    
    if (profesionalRows.length === 0) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    
    if (profesionalRows[0].estado !== 'disponible') {
      return res.status(400).json({ error: 'El profesional no está disponible' });
    }
    
    // Validar horario de la cita
    const horarioProfesional = profesionalRows[0].horario;
    const validacionHorario = verificarHorarioCita(fecha, hora, horarioProfesional);
    
    // Si la cita está fuera del horario, se requiere marcar como excepcional
    if (!validacionHorario.dentroHorario) {
      if (!es_excepcional || !razon_excepcional) {
        const diaCapitalizado = validacionHorario.dia ? validacionHorario.dia.charAt(0).toUpperCase() + validacionHorario.dia.slice(1) : 'ese día';
        const mensajeHorario = validacionHorario.horarioDia 
          ? `${diaCapitalizado}: ${validacionHorario.horarioDia.inicio}-${validacionHorario.horarioDia.fin}`
          : `${diaCapitalizado} no tiene horario configurado`;
        
        return res.status(400).json({ 
          error: `La cita está fuera del horario del profesional (${mensajeHorario}). Debe marcar esta cita como excepcional y proporcionar una razón.`,
          fueraHorario: true,
          horarioProfesional: validacionHorario
        });
      }
    }
    
    // Validar que no haya conflicto de horarios (excluyendo la cita actual)
    const [conflictos] = await pool.execute(
      `SELECT id FROM citas 
       WHERE profesional_id = ? 
       AND fecha = ? 
       AND hora = ? 
       AND estado IN ('pendiente', 'confirmada')
       AND id != ?`,
      [profesionalIdNuevo, fecha, hora, id]
    );
    
    if (conflictos.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cita en ese horario para este profesional' });
    }
    
    // Actualizar la cita
    const updateFields = ['fecha = ?', 'hora = ?'];
    const updateParams = [fecha, hora];
    
    if (profesional_id) {
      updateFields.push('profesional_id = ?');
      updateParams.push(profesionalIdNuevo);
    }
    
    if (es_excepcional !== undefined) {
      updateFields.push('es_excepcional = ?');
      updateParams.push(es_excepcional || false);
    }
    
    if (razon_excepcional !== undefined) {
      updateFields.push('razon_excepcional = ?');
      updateParams.push(razon_excepcional || null);
    }
    
    if (razon_adicional !== undefined) {
      updateFields.push('razon_adicional = ?');
      updateParams.push(razon_adicional || null);
    }
    
    updateParams.push(id);
    
    await pool.execute(
      `UPDATE citas SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    // Obtener la cita actualizada
    const [citaActualizada] = await pool.execute(
      `SELECT 
        c.id,
        TIME(c.hora) as time,
        pa.nombre_completo as patient,
        pa.dni,
        pa.telefono,
        pa.email,
        pr.nombre_completo as doctor,
        pr.id as profesional_id,
        e.nombre as specialty,
        c.estado as status,
        DATE_FORMAT(c.fecha, '%Y-%m-%d') as fecha,
        c.hora,
        c.notas,
        c.es_excepcional,
        c.razon_excepcional,
        c.razon_adicional
      FROM citas c
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      INNER JOIN profesionales pr ON c.profesional_id = pr.id
      INNER JOIN especialidades e ON pr.especialidad_id = e.id
      WHERE c.id = ?`,
      [id]
    );
    
    const cita = citaActualizada[0];
    
    // Mapear estado
    let status = 'pending';
    if (cita.status === 'confirmada') {
      status = 'confirmed';
    } else if (cita.status === 'cancelada') {
      status = 'released';
    } else if (cita.status === 'no_show') {
      status = 'offered';
    }
    
    // Obtener canal de confirmación
    const [confirmaciones] = await pool.execute(
      `SELECT canal FROM confirmaciones WHERE cita_id = ? ORDER BY fecha_envio DESC LIMIT 1`,
      [id]
    );
    
    let channel = 'App';
    if (confirmaciones.length > 0) {
      channel = confirmaciones[0].canal;
    }
    
    res.json({
      id: cita.id.toString(),
      time: cita.time.substring(0, 5),
      patient: cita.patient,
      dni: cita.dni,
      phone: cita.telefono,
      email: cita.email,
      doctor: cita.doctor,
      profesional_id: cita.profesional_id,
      specialty: cita.specialty,
      status: status,
      channel: channel,
      fecha: cita.fecha,
      hora: cita.hora,
      notas: cita.notas,
      es_excepcional: cita.es_excepcional || false,
      razon_excepcional: cita.razon_excepcional,
      razon_adicional: cita.razon_adicional,
    });
  } catch (error) {
    console.error('Error updating cita:', error);
    res.status(500).json({ error: 'Error al reagendar la cita' });
  }
};

// PATCH /api/citas/:id/confirmar - Confirmar cita
export const confirmarCita = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que la cita existe
    const [citaRows] = await pool.execute(
      `SELECT c.*, pa.nombre_completo as patient, pa.telefono, pa.email,
              pr.nombre_completo as doctor, e.nombre as specialty
       FROM citas c
       INNER JOIN pacientes pa ON c.paciente_id = pa.id
       INNER JOIN profesionales pr ON c.profesional_id = pr.id
       INNER JOIN especialidades e ON pr.especialidad_id = e.id
       WHERE c.id = ?`,
      [id]
    );
    
    if (citaRows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    const cita = citaRows[0];
    
    // Verificar que la cita no esté cancelada o completada
    if (cita.estado === 'cancelada') {
      return res.status(400).json({ error: 'No se puede confirmar una cita cancelada' });
    }
    
    if (cita.estado === 'completada') {
      return res.status(400).json({ error: 'No se puede confirmar una cita completada' });
    }
    
    // Actualizar estado de la cita
    await pool.execute(
      `UPDATE citas SET estado = 'confirmada' WHERE id = ?`,
      [id]
    );
    
    // Obtener canal preferido (por defecto SMS, pero podría venir de confirmaciones previas)
    const [confirmacionesPrevias] = await pool.execute(
      `SELECT canal FROM confirmaciones WHERE cita_id = ? ORDER BY fecha_envio DESC LIMIT 1`,
      [id]
    );
    
    const canal = confirmacionesPrevias.length > 0 ? confirmacionesPrevias[0].canal : 'SMS';
    
    // Enviar mensaje de confirmación si el paciente tiene teléfono
    let mensajeEnviado = false;
    if (cita.telefono) {
      try {
        const citaParaMensaje = {
          id: cita.id,
          fecha: cita.fecha.toISOString().split('T')[0],
          hora: cita.hora.substring(0, 5),
          patient: cita.patient,
          telefono: cita.telefono,
          doctor: cita.doctor,
          specialty: cita.specialty
        };
        
        await enviarConfirmacionManual(citaParaMensaje, canal);
        mensajeEnviado = true;
      } catch (error) {
        console.error('Error enviando mensaje de confirmación:', error);
        // No fallar la operación si el mensaje no se puede enviar
      }
    }
    
    // Obtener la cita actualizada
    const [citaActualizada] = await pool.execute(
      `SELECT 
        c.id,
        TIME(c.hora) as time,
        pa.nombre_completo as patient,
        pa.dni,
        pa.telefono,
        pa.email,
        pr.nombre_completo as doctor,
        pr.id as profesional_id,
        e.nombre as specialty,
        c.estado as status,
        DATE_FORMAT(c.fecha, '%Y-%m-%d') as fecha,
        c.hora,
        c.notas
      FROM citas c
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      INNER JOIN profesionales pr ON c.profesional_id = pr.id
      INNER JOIN especialidades e ON pr.especialidad_id = e.id
      WHERE c.id = ?`,
      [id]
    );
    
    const citaActual = citaActualizada[0];
    
    res.json({
      id: citaActual.id.toString(),
      time: citaActual.time.substring(0, 5),
      patient: citaActual.patient,
      dni: citaActual.dni,
      phone: citaActual.telefono,
      email: citaActual.email,
      doctor: citaActual.doctor,
      profesional_id: citaActual.profesional_id,
      specialty: citaActual.specialty,
      status: 'confirmed',
      channel: canal,
      fecha: citaActual.fecha,
      hora: citaActual.hora,
      notas: citaActual.notas,
      mensajeEnviado
    });
  } catch (error) {
    console.error('Error confirming cita:', error);
    res.status(500).json({ error: 'Error al confirmar la cita' });
  }
};

// PATCH /api/citas/:id/cancelar - Cancelar cita
export const cancelarCita = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que la cita existe
    const [citaRows] = await pool.execute(
      `SELECT c.*, pr.id as profesional_id
       FROM citas c
       INNER JOIN profesionales pr ON c.profesional_id = pr.id
       WHERE c.id = ?`,
      [id]
    );
    
    if (citaRows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    const cita = citaRows[0];
    
    // Verificar que la cita no esté ya cancelada
    if (cita.estado === 'cancelada') {
      return res.status(400).json({ error: 'La cita ya está cancelada' });
    }
    
    if (cita.estado === 'completada') {
      return res.status(400).json({ error: 'No se puede cancelar una cita completada' });
    }
    
    // Guardar información antes de cancelar para notificar lista de espera
    const profesionalId = cita.profesional_id;
    // Manejar fecha como Date o string
    const fecha = cita.fecha instanceof Date 
      ? cita.fecha.toISOString().split('T')[0]
      : typeof cita.fecha === 'string' 
        ? cita.fecha.split('T')[0]
        : cita.fecha;
    // Manejar hora como Time o string
    const hora = typeof cita.hora === 'string' 
      ? cita.hora.substring(0, 5)
      : cita.hora.toString().substring(0, 5);
    
    // Actualizar estado de la cita
    await pool.execute(
      `UPDATE citas SET estado = 'cancelada' WHERE id = ?`,
      [id]
    );
    
    // Notificar lista de espera si la cita estaba confirmada o pendiente
    if (cita.estado === 'confirmada' || cita.estado === 'pendiente') {
      try {
        await notificarListaEsperaPorCitaCancelada(profesionalId, fecha, hora);
      } catch (error) {
        console.error('Error notificando lista de espera:', error);
        // No fallar la operación si no se puede notificar la lista de espera
      }
    }
    
    // Obtener la cita actualizada
    const [citaActualizada] = await pool.execute(
      `SELECT 
        c.id,
        TIME(c.hora) as time,
        pa.nombre_completo as patient,
        pa.dni,
        pa.telefono,
        pa.email,
        pr.nombre_completo as doctor,
        pr.id as profesional_id,
        e.nombre as specialty,
        c.estado as status,
        DATE_FORMAT(c.fecha, '%Y-%m-%d') as fecha,
        c.hora,
        c.notas
      FROM citas c
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      INNER JOIN profesionales pr ON c.profesional_id = pr.id
      INNER JOIN especialidades e ON pr.especialidad_id = e.id
      WHERE c.id = ?`,
      [id]
    );
    
    const citaActual = citaActualizada[0];
    
    // Obtener canal
    const [confirmaciones] = await pool.execute(
      `SELECT canal FROM confirmaciones WHERE cita_id = ? ORDER BY fecha_envio DESC LIMIT 1`,
      [id]
    );
    
    let channel = 'App';
    if (confirmaciones.length > 0) {
      channel = confirmaciones[0].canal;
    }
    
    res.json({
      id: citaActual.id.toString(),
      time: citaActual.time.substring(0, 5),
      patient: citaActual.patient,
      dni: citaActual.dni,
      phone: citaActual.telefono,
      email: citaActual.email,
      doctor: citaActual.doctor,
      profesional_id: citaActual.profesional_id,
      specialty: citaActual.specialty,
      status: 'released',
      channel: channel,
      fecha: citaActual.fecha,
      hora: citaActual.hora,
      notas: citaActual.notas,
    });
  } catch (error) {
    console.error('Error canceling cita:', error);
    res.status(500).json({ error: 'Error al cancelar la cita' });
  }
};

