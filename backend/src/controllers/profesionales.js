import { pool } from '../db.js';
import { validarEstructuraHorario } from '../utils/horarios.js';

// GET /api/profesionales
export const getProfesionales = async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        p.id,
        p.nombre_completo as name,
        p.especialidad_id,
        e.nombre as specialty,
        p.cmp,
        p.consultorio,
        p.horario as schedule,
        p.estado as status,
        COUNT(c.id) as appointments
      FROM profesionales p
      INNER JOIN especialidades e ON p.especialidad_id = e.id
      LEFT JOIN citas c ON p.id = c.profesional_id AND c.fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (p.nombre_completo LIKE ? OR e.nombre LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ` GROUP BY p.id ORDER BY p.nombre_completo ASC`;
    
    const [rows] = await pool.execute(query, params);
    
    const profesionales = rows.map(prof => ({
      id: prof.id,
      name: prof.name,
      especialidad_id: prof.especialidad_id,
      specialty: prof.specialty,
      cmp: prof.cmp,
      consultorio: prof.consultorio,
      schedule: prof.schedule,
      appointments: prof.appointments || 0,
      status: prof.status,
    }));

    // Obtener estadísticas
    const [total] = await pool.execute('SELECT COUNT(*) as total FROM profesionales');
    const [disponibles] = await pool.execute(
      `SELECT COUNT(*) as total FROM profesionales WHERE estado = 'disponible'`
    );
    const [especialidades] = await pool.execute(
      `SELECT COUNT(DISTINCT especialidad_id) as total FROM profesionales`
    );
    const [consultorios] = await pool.execute(
      `SELECT COUNT(DISTINCT consultorio) as total FROM profesionales WHERE consultorio IS NOT NULL`
    );

    res.json({
      profesionales,
      stats: {
        total: total[0].total,
        disponibles: disponibles[0].total,
        especialidades: especialidades[0].total,
        consultoriosActivos: consultorios[0].total,
      },
    });
  } catch (error) {
    console.error('Error getting profesionales:', error);
    res.status(500).json({ error: 'Error al obtener profesionales' });
  }
};

// POST /api/profesionales
export const createProfesional = async (req, res) => {
  try {
    const { nombre_completo, cmp, especialidad_id, consultorio, horario, estado } = req.body;
    
    // Validaciones básicas
    if (!nombre_completo || nombre_completo.trim() === '') {
      return res.status(400).json({ error: 'El nombre completo es requerido' });
    }
    
    if (!cmp || cmp.trim() === '') {
      return res.status(400).json({ error: 'El CMP es requerido' });
    }
    
    if (!especialidad_id) {
      return res.status(400).json({ error: 'La especialidad es requerida' });
    }
    
    // Validar que la especialidad existe
    const [especialidadRows] = await pool.execute(
      `SELECT id FROM especialidades WHERE id = ? AND activo = 1`,
      [especialidad_id]
    );
    
    if (especialidadRows.length === 0) {
      return res.status(404).json({ error: 'Especialidad no encontrada o inactiva' });
    }
    
    // Validar que el CMP no exista
    const [cmpExists] = await pool.execute(
      `SELECT id FROM profesionales WHERE cmp = ?`,
      [cmp.trim()]
    );
    
    if (cmpExists.length > 0) {
      return res.status(409).json({ error: 'Ya existe un profesional con ese CMP' });
    }
    
    // Validar y procesar horario si se proporciona
    let horarioJson = null;
    if (horario) {
      // Si es string, intentar parsearlo
      let horarioObj;
      if (typeof horario === 'string') {
        try {
          horarioObj = JSON.parse(horario);
        } catch (e) {
          return res.status(400).json({ error: 'El formato del horario es inválido. Debe ser un JSON válido.' });
        }
      } else {
        horarioObj = horario;
      }
      
      // Validar estructura del horario
      const validacion = validarEstructuraHorario(horarioObj);
      if (!validacion.valido) {
        return res.status(400).json({ error: validacion.error });
      }
      
      horarioJson = JSON.stringify(horarioObj);
    }
    
    // Crear el profesional
    const [result] = await pool.execute(
      `INSERT INTO profesionales (nombre_completo, cmp, especialidad_id, consultorio, horario, estado) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre_completo.trim(),
        cmp.trim(),
        especialidad_id,
        consultorio?.trim() || null,
        horarioJson,
        estado || 'disponible'
      ]
    );
    
    // Obtener el profesional creado
    const [rows] = await pool.execute(
      `SELECT 
        p.id,
        p.nombre_completo as name,
        e.nombre as specialty,
        p.cmp,
        p.consultorio,
        p.horario as schedule,
        p.estado as status
      FROM profesionales p
      INNER JOIN especialidades e ON p.especialidad_id = e.id
      WHERE p.id = ?`,
      [result.insertId]
    );
    
    const profesional = {
      id: rows[0].id,
      name: rows[0].name,
      specialty: rows[0].specialty,
      cmp: rows[0].cmp,
      consultorio: rows[0].consultorio,
      schedule: rows[0].schedule,
      status: rows[0].status,
      appointments: 0,
    };
    
    res.status(201).json(profesional);
  } catch (error) {
    console.error('Error creating profesional:', error);
    
    // Manejar errores de duplicado
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('cmp')) {
      return res.status(409).json({ error: 'Ya existe un profesional con ese CMP' });
    }
    
    res.status(500).json({ error: 'Error al crear el profesional' });
  }
};

// PUT /api/profesionales/:id
export const updateProfesional = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, cmp, especialidad_id, consultorio, horario, estado } = req.body;
    
    // Validar que el profesional existe
    const [existing] = await pool.execute(
      `SELECT id FROM profesionales WHERE id = ?`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    
    // Si se está actualizando el CMP, validar que no exista otro con ese CMP
    if (cmp && cmp.trim() !== '') {
      const [duplicate] = await pool.execute(
        `SELECT id FROM profesionales WHERE cmp = ? AND id != ?`,
        [cmp.trim(), id]
      );
      
      if (duplicate.length > 0) {
        return res.status(409).json({ error: 'Ya existe otro profesional con ese CMP' });
      }
    }
    
    // Si se está actualizando la especialidad, validar que existe
    if (especialidad_id) {
      const [especialidadRows] = await pool.execute(
        `SELECT id FROM especialidades WHERE id = ? AND activo = 1`,
        [especialidad_id]
      );
      
      if (especialidadRows.length === 0) {
        return res.status(404).json({ error: 'Especialidad no encontrada o inactiva' });
      }
    }
    
    // Construir query de actualización
    const updateFields = [];
    const updateParams = [];
    
    if (nombre_completo !== undefined) {
      updateFields.push('nombre_completo = ?');
      updateParams.push(nombre_completo.trim());
    }
    
    if (cmp !== undefined) {
      updateFields.push('cmp = ?');
      updateParams.push(cmp.trim());
    }
    
    if (especialidad_id !== undefined) {
      updateFields.push('especialidad_id = ?');
      updateParams.push(especialidad_id);
    }
    
    if (consultorio !== undefined) {
      updateFields.push('consultorio = ?');
      updateParams.push(consultorio?.trim() || null);
    }
    
    if (horario !== undefined) {
      // Validar y procesar horario si se proporciona
      let horarioJson = null;
      if (horario) {
        // Si es string, intentar parsearlo
        let horarioObj;
        if (typeof horario === 'string') {
          try {
            horarioObj = JSON.parse(horario);
          } catch (e) {
            return res.status(400).json({ error: 'El formato del horario es inválido. Debe ser un JSON válido.' });
          }
        } else {
          horarioObj = horario;
        }
        
        // Validar estructura del horario
        const validacion = validarEstructuraHorario(horarioObj);
        if (!validacion.valido) {
          return res.status(400).json({ error: validacion.error });
        }
        
        horarioJson = JSON.stringify(horarioObj);
      }
      
      updateFields.push('horario = ?');
      updateParams.push(horarioJson);
    }
    
    if (estado !== undefined) {
      updateFields.push('estado = ?');
      updateParams.push(estado);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }
    
    updateParams.push(id);
    
    await pool.execute(
      `UPDATE profesionales SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    // Obtener el profesional actualizado
    const [rows] = await pool.execute(
      `SELECT 
        p.id,
        p.nombre_completo as name,
        e.nombre as specialty,
        p.cmp,
        p.consultorio,
        p.horario as schedule,
        p.estado as status,
        COUNT(c.id) as appointments
      FROM profesionales p
      INNER JOIN especialidades e ON p.especialidad_id = e.id
      LEFT JOIN citas c ON p.id = c.profesional_id AND c.fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      WHERE p.id = ?
      GROUP BY p.id`,
      [id]
    );
    
    const profesional = {
      id: rows[0].id,
      name: rows[0].name,
      specialty: rows[0].specialty,
      cmp: rows[0].cmp,
      consultorio: rows[0].consultorio,
      schedule: rows[0].schedule,
      status: rows[0].status,
      appointments: rows[0].appointments || 0,
    };
    
    res.json(profesional);
  } catch (error) {
    console.error('Error updating profesional:', error);
    
    // Manejar errores de duplicado
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('cmp')) {
      return res.status(409).json({ error: 'Ya existe otro profesional con ese CMP' });
    }
    
    res.status(500).json({ error: 'Error al actualizar el profesional' });
  }
};

// DELETE /api/profesionales/:id
export const deleteProfesional = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el profesional existe
    const [existing] = await pool.execute(
      `SELECT id, nombre_completo FROM profesionales WHERE id = ?`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    
    // Validar que no tenga citas activas
    const [citas] = await pool.execute(
      `SELECT COUNT(*) as count FROM citas 
       WHERE profesional_id = ? 
       AND estado IN ('pendiente', 'confirmada')`,
      [id]
    );
    
    if (citas[0].count > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar el profesional porque tiene ${citas[0].count} cita(s) activa(s)` 
      });
    }
    
    // Eliminar el profesional
    await pool.execute(
      `DELETE FROM profesionales WHERE id = ?`,
      [id]
    );
    
    res.json({ message: 'Profesional eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting profesional:', error);
    res.status(500).json({ error: 'Error al eliminar el profesional' });
  }
};

