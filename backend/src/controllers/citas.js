import { pool } from '../db.js';

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
        c.fecha,
        c.hora,
        c.notas
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
    const { dni, nombre_completo, telefono, email, profesional_id, fecha, hora, notas } = req.body;
    
    // Validaciones básicas
    if (!dni || !nombre_completo || !profesional_id || !fecha || !hora) {
      return res.status(400).json({ error: 'Faltan campos requeridos: dni, nombre_completo, profesional_id, fecha, hora' });
    }
    
    // Validar que el profesional existe y está disponible
    const [profesionalRows] = await pool.execute(
      `SELECT id, estado FROM profesionales WHERE id = ?`,
      [profesional_id]
    );
    
    if (profesionalRows.length === 0) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    
    if (profesionalRows[0].estado !== 'disponible') {
      return res.status(400).json({ error: 'El profesional no está disponible' });
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
      `INSERT INTO citas (paciente_id, profesional_id, fecha, hora, estado, notas) 
       VALUES (?, ?, ?, ?, 'pendiente', ?)`,
      [pacienteId, profesional_id, fecha, hora, notas || null]
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
        c.fecha,
        c.hora,
        c.notas
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

