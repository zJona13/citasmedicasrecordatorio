import { pool } from '../db.js';
import { verificarHorarioCita } from '../utils/horarios.js';
import { enviarConfirmacionManual } from '../services/messaging.js';
import { notificarListaEsperaPorCitaCancelada } from '../services/notifications.js';

// GET /api/citas
export const getCitas = async (req, res) => {
  try {
    const { fecha, fecha_inicio, fecha_fin, profesional_id } = req.query;

    const params = [];
    let whereClause = 'WHERE 1=1';

    // Soporte para fecha única (compatibilidad hacia atrás)
    if (fecha) {
      whereClause += ` AND c.fecha = ?`;
      params.push(fecha);
    }

    // Soporte para rango de fechas
    if (fecha_inicio && fecha_fin) {
      whereClause += ` AND c.fecha >= ? AND c.fecha <= ?`;
      params.push(fecha_inicio, fecha_fin);
    } else if (fecha_inicio) {
      whereClause += ` AND c.fecha >= ?`;
      params.push(fecha_inicio);
    } else if (fecha_fin) {
      whereClause += ` AND c.fecha <= ?`;
      params.push(fecha_fin);
    }

    // Si no se proporciona ninguna fecha, usar la fecha de hoy
    if (!fecha && !fecha_inicio && !fecha_fin) {
      const fechaHoy = new Date().toISOString().split('T')[0];
      whereClause += ` AND c.fecha = ?`;
      params.push(fechaHoy);
    }

    if (profesional_id) {
      whereClause += ` AND c.profesional_id = ?`;
      params.push(profesional_id);
    }

    // Optimización: Usar LEFT JOIN con subconsulta para obtener la última confirmación en una sola consulta
    // Esto elimina el problema N+1 (de N+1 consultas a 1 sola consulta)
    const query = `
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
        c.razon_adicional,
        conf.canal as channel
      FROM citas c
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      INNER JOIN profesionales pr ON c.profesional_id = pr.id
      INNER JOIN especialidades e ON pr.especialidad_id = e.id
      LEFT JOIN (
        SELECT conf1.cita_id, conf1.canal
        FROM confirmaciones conf1
        INNER JOIN (
          SELECT cita_id, MAX(fecha_envio) as max_fecha_envio
          FROM confirmaciones
          GROUP BY cita_id
        ) conf2 ON conf1.cita_id = conf2.cita_id AND conf1.fecha_envio = conf2.max_fecha_envio
      ) conf ON c.id = conf.cita_id
      ${whereClause}
      ORDER BY c.fecha ASC, c.hora ASC
    `;

    const [rows] = await pool.execute(query, params);

    // Mapear resultados directamente sin consultas adicionales
    const citas = rows.map((cita) => {
      // Mapear estado de la base de datos al formato esperado por el frontend
      let status = 'pending';
      if (cita.status === 'confirmada') {
        status = 'confirmed';
      } else if (cita.status === 'cancelada') {
        status = 'released';
      } else if (cita.status === 'no_show') {
        status = 'no_show';
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
        channel: cita.channel || 'App',
        fecha: cita.fecha,
        hora: cita.hora,
        notas: cita.notas,
        es_excepcional: cita.es_excepcional || false,
        razon_excepcional: cita.razon_excepcional,
        razon_adicional: cita.razon_adicional,
      };
    });

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
      status = 'no_show';
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
    console.log(`[DEBUG] Intentando confirmar cita ID: ${id}`);

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
      console.log(`[DEBUG] Cita ID ${id} no encontrada`);
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const cita = citaRows[0];
    console.log(`[DEBUG] Cita encontrada:`, { id: cita.id, estado: cita.estado, paciente: cita.patient });

    // Verificar que la cita no esté cancelada o completada
    if (cita.estado === 'cancelada') {
      console.log(`[DEBUG] Cita ID ${id} ya está cancelada`);
      return res.status(400).json({ error: 'No se puede confirmar una cita cancelada' });
    }

    if (cita.estado === 'completada') {
      console.log(`[DEBUG] Cita ID ${id} ya está completada`);
      return res.status(400).json({ error: 'No se puede confirmar una cita completada' });
    }

    // Actualizar estado de la cita
    console.log(`[DEBUG] Actualizando estado a 'confirmada' para cita ID ${id}`);
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

        console.log(`[DEBUG] Enviando mensaje de confirmación para cita ID ${id}`);
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
    console.log(`[DEBUG] Cita ID ${id} confirmada exitosamente. Nuevo estado: ${citaActual.status}`);

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

// GET /api/citas/buscar/:dni - Buscar citas por DNI
export const buscarCitasPorDNI = async (req, res) => {
  try {
    const { dni } = req.params;

    if (!dni || dni.trim() === '') {
      return res.status(400).json({ error: 'DNI es requerido' });
    }

    // Optimización: Usar LEFT JOIN con subconsulta para obtener la última confirmación en una sola consulta
    // Esto elimina el problema N+1
    const query = `
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
        c.razon_adicional,
        conf.canal as channel
      FROM citas c
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      INNER JOIN profesionales pr ON c.profesional_id = pr.id
      INNER JOIN especialidades e ON pr.especialidad_id = e.id
      LEFT JOIN (
        SELECT conf1.cita_id, conf1.canal
        FROM confirmaciones conf1
        INNER JOIN (
          SELECT cita_id, MAX(fecha_envio) as max_fecha_envio
          FROM confirmaciones
          GROUP BY cita_id
        ) conf2 ON conf1.cita_id = conf2.cita_id AND conf1.fecha_envio = conf2.max_fecha_envio
      ) conf ON c.id = conf.cita_id
      WHERE pa.dni = ?
      ORDER BY 
        CASE 
          WHEN c.fecha > CURDATE() THEN 1
          WHEN c.fecha = CURDATE() THEN 2
          ELSE 3
        END,
        CASE 
          WHEN c.fecha > CURDATE() THEN CONCAT(c.fecha, ' ', c.hora)
          ELSE '9999-12-31 23:59:59'
        END ASC,
        CASE 
          WHEN c.fecha = CURDATE() THEN CONCAT('2000-01-01 ', c.hora)
          ELSE '2000-01-01 00:00:00'
        END DESC,
        CASE 
          WHEN c.fecha < CURDATE() THEN CONCAT(c.fecha, ' ', c.hora)
          ELSE '1900-01-01 00:00:00'
        END DESC
    `;

    const [rows] = await pool.execute(query, [dni]);

    // Mapear resultados directamente sin consultas adicionales
    const citas = rows.map((cita) => {
      // Mapear estado de la base de datos al formato esperado por el frontend
      let status = 'pending';
      if (cita.status === 'confirmada') {
        status = 'confirmed';
      } else if (cita.status === 'cancelada') {
        status = 'released';
      } else if (cita.status === 'no_show') {
        status = 'no_show';
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
        channel: cita.channel || 'App',
        fecha: cita.fecha,
        hora: cita.hora,
        notas: cita.notas,
        es_excepcional: cita.es_excepcional || false,
        razon_excepcional: cita.razon_excepcional,
        razon_adicional: cita.razon_adicional,
      };
    });

    res.json(citas);
  } catch (error) {
    console.error('Error buscando citas por DNI:', error);
    res.status(500).json({ error: 'Error al buscar citas' });
  }
};

// PATCH /api/citas/:id/no-show - Marcar cita como no-show
export const marcarNoShow = async (req, res) => {
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

    // Verificar que la cita esté en estado pendiente o confirmada
    if (cita.estado !== 'pendiente' && cita.estado !== 'confirmada') {
      return res.status(400).json({
        error: 'Solo se pueden marcar como no-show las citas en estado pendiente o confirmada'
      });
    }

    // Actualizar estado de la cita a no_show
    await pool.execute(
      `UPDATE citas SET estado = 'no_show' WHERE id = ?`,
      [id]
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

    const citaActual = citaActualizada[0];

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
      id: citaActual.id.toString(),
      time: citaActual.time.substring(0, 5),
      patient: citaActual.patient,
      dni: citaActual.dni,
      phone: citaActual.telefono,
      email: citaActual.email,
      doctor: citaActual.doctor,
      profesional_id: citaActual.profesional_id,
      specialty: citaActual.specialty,
      status: 'no_show',
      channel: channel,
      fecha: citaActual.fecha,
      hora: citaActual.hora,
      notas: citaActual.notas,
      es_excepcional: citaActual.es_excepcional || false,
      razon_excepcional: citaActual.razon_excepcional,
      razon_adicional: citaActual.razon_adicional,
    });
  } catch (error) {
    console.error('Error marking cita as no-show:', error);
    res.status(500).json({ error: 'Error al marcar la cita como no-show' });
  }
};

// GET /api/citas/exportar - Exportar todas las citas a CSV
export const exportarCitasCSV = async (req, res) => {
  console.log('Exportar CSV endpoint llamado');
  try {
    // Optimización: Usar LEFT JOIN con subconsulta para obtener la última confirmación en una sola consulta
    // Esto elimina el problema N+1
    const query = `
      SELECT 
        c.id,
        DATE_FORMAT(c.fecha, '%Y-%m-%d') as fecha,
        TIME(c.hora) as hora,
        c.estado as status,
        pa.dni,
        pa.nombre_completo as paciente_nombre,
        pa.telefono,
        pa.email,
        pr.nombre_completo as profesional_nombre,
        pr.id as profesional_id,
        e.nombre as especialidad,
        c.notas,
        c.es_excepcional,
        c.razon_excepcional,
        c.razon_adicional,
        COALESCE(conf.canal, 'App') as canal
      FROM citas c
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      INNER JOIN profesionales pr ON c.profesional_id = pr.id
      INNER JOIN especialidades e ON pr.especialidad_id = e.id
      LEFT JOIN (
        SELECT conf1.cita_id, conf1.canal
        FROM confirmaciones conf1
        INNER JOIN (
          SELECT cita_id, MAX(fecha_envio) as max_fecha_envio
          FROM confirmaciones
          GROUP BY cita_id
        ) conf2 ON conf1.cita_id = conf2.cita_id AND conf1.fecha_envio = conf2.max_fecha_envio
      ) conf ON c.id = conf.cita_id
      ORDER BY c.fecha ASC, c.hora ASC
    `;

    const [citasConConfirmacion] = await pool.execute(query);

    // Mapear estados al formato legible
    const estadoMap = {
      'pendiente': 'Pendiente',
      'confirmada': 'Confirmada',
      'cancelada': 'Cancelada',
      'completada': 'Completada',
      'no_show': 'No Show'
    };

    const razonExcepcionalMap = {
      'emergencia': 'Emergencia',
      'caso_especial': 'Caso Especial',
      'extension_horario': 'Extensión de Horario',
      'otro': 'Otro'
    };

    // Generar CSV
    const headers = [
      'ID',
      'Fecha',
      'Hora',
      'Estado',
      'DNI',
      'Nombre Completo',
      'Teléfono',
      'Email',
      'Profesional',
      'ID Profesional',
      'Especialidad',
      'Notas',
      'Es Excepcional',
      'Razón Excepcional',
      'Razón Adicional',
      'Canal'
    ];

    // Función para escapar valores CSV (manejar comillas y comas)
    const escapeCSV = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      const str = String(value);
      // Si contiene comillas, comas o saltos de línea, envolver en comillas y escapar comillas
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replaceAll('"', '""')}"`;
      }
      return str;
    };

    // Construir CSV
    let csv = headers.join(',') + '\n';

    for (const row of citasConConfirmacion) {
      const estado = estadoMap[row.status] || row.status;
      const razonExcepcional = row.razon_excepcional
        ? (razonExcepcionalMap[row.razon_excepcional] || row.razon_excepcional)
        : '';
      const esExcepcional = row.es_excepcional ? 'Sí' : 'No';

      const csvRow = [
        escapeCSV(row.id),
        escapeCSV(row.fecha),
        escapeCSV(row.hora ? row.hora.substring(0, 5) : ''), // Formato HH:MM
        escapeCSV(estado),
        escapeCSV(row.dni),
        escapeCSV(row.paciente_nombre),
        escapeCSV(row.telefono),
        escapeCSV(row.email),
        escapeCSV(row.profesional_nombre),
        escapeCSV(row.profesional_id),
        escapeCSV(row.especialidad),
        escapeCSV(row.notas),
        escapeCSV(esExcepcional),
        escapeCSV(razonExcepcional),
        escapeCSV(row.razon_adicional),
        escapeCSV(row.canal)
      ];

      csv += csvRow.join(',') + '\n';
    }

    // Generar nombre de archivo con fecha actual
    const fechaActual = new Date().toISOString().split('T')[0];
    const filename = `citas_${fechaActual}.csv`;

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Incluir BOM UTF-8 al inicio del CSV para Excel
    const csvWithBOM = '\ufeff' + csv;

    // Enviar respuesta
    res.send(csvWithBOM);
  } catch (error) {
    console.error('Error exporting citas to CSV:', error);
    // Solo enviar error si la respuesta no ha sido enviada aún
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al exportar citas a CSV' });
    }
  }
};

