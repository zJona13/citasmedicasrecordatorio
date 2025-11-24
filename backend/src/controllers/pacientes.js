import { pool } from '../db.js';

// GET /api/pacientes
export const getPacientes = async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        p.id,
        p.dni,
        p.nombre_completo as name,
        p.telefono as phone,
        p.email,
        p.estado as status,
        MAX(c.fecha) as lastVisit,
        COUNT(c.id) as appointments
      FROM pacientes p
      LEFT JOIN citas c ON p.id = c.paciente_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (p.nombre_completo LIKE ? OR p.dni LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ` GROUP BY p.id ORDER BY p.nombre_completo ASC`;
    
    const [rows] = await pool.execute(query, params);
    
    // Formatear fecha de última visita
    const pacientes = rows.map(p => ({
      id: p.id,
      name: p.name,
      dni: p.dni,
      phone: p.phone,
      email: p.email,
      lastVisit: p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : '-',
      appointments: p.appointments || 0,
      status: p.status,
    }));

    // Optimización: Obtener todas las estadísticas en una sola consulta usando subconsultas
    const [statsRows] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM pacientes) as total,
        (SELECT COUNT(*) FROM pacientes WHERE estado = 'activo' AND fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as activos,
        (SELECT COUNT(*) FROM pacientes WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 1 MONTH)) as nuevos,
        (SELECT COUNT(DISTINCT paciente_id) FROM citas WHERE estado IN ('pendiente', 'confirmada')) as conCitasPendientes
    `);

    res.json({
      pacientes,
      stats: {
        total: statsRows[0].total,
        activos: statsRows[0].activos,
        nuevos: statsRows[0].nuevos,
        conCitasPendientes: statsRows[0].conCitasPendientes,
      },
    });
  } catch (error) {
    console.error('Error getting pacientes:', error);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
};

// POST /api/pacientes
export const createPaciente = async (req, res) => {
  try {
    const { dni, nombre_completo, telefono, email, fecha_nacimiento, direccion, estado } = req.body;
    
    // Validaciones básicas
    if (!dni || dni.trim() === '') {
      return res.status(400).json({ error: 'El DNI es requerido' });
    }
    
    if (!nombre_completo || nombre_completo.trim() === '') {
      return res.status(400).json({ error: 'El nombre completo es requerido' });
    }
    
    // Validar que el DNI no exista
    const [dniExists] = await pool.execute(
      `SELECT id FROM pacientes WHERE dni = ?`,
      [dni.trim()]
    );
    
    if (dniExists.length > 0) {
      return res.status(409).json({ error: 'Ya existe un paciente con ese DNI' });
    }
    
    // Crear el paciente
    const [result] = await pool.execute(
      `INSERT INTO pacientes (dni, nombre_completo, telefono, email, fecha_nacimiento, direccion, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dni.trim(),
        nombre_completo.trim(),
        telefono?.trim() || null,
        email?.trim() || null,
        fecha_nacimiento || null,
        direccion?.trim() || null,
        estado || 'activo'
      ]
    );
    
    // Obtener el paciente creado
    const [rows] = await pool.execute(
      `SELECT 
        p.id,
        p.dni,
        p.nombre_completo as name,
        p.telefono as phone,
        p.email,
        p.estado as status,
        MAX(c.fecha) as lastVisit,
        COUNT(c.id) as appointments
      FROM pacientes p
      LEFT JOIN citas c ON p.id = c.paciente_id
      WHERE p.id = ?
      GROUP BY p.id`,
      [result.insertId]
    );
    
    const paciente = {
      id: rows[0].id,
      name: rows[0].name,
      dni: rows[0].dni,
      phone: rows[0].phone,
      email: rows[0].email,
      lastVisit: rows[0].lastVisit ? new Date(rows[0].lastVisit).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : '-',
      appointments: rows[0].appointments || 0,
      status: rows[0].status,
    };
    
    res.status(201).json(paciente);
  } catch (error) {
    console.error('Error creating paciente:', error);
    
    // Manejar errores de duplicado
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('dni')) {
      return res.status(409).json({ error: 'Ya existe un paciente con ese DNI' });
    }
    
    res.status(500).json({ error: 'Error al crear el paciente' });
  }
};

// PUT /api/pacientes/:id
export const updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { dni, nombre_completo, telefono, email, fecha_nacimiento, direccion, estado } = req.body;
    
    // Validar que el paciente existe
    const [existing] = await pool.execute(
      `SELECT id FROM pacientes WHERE id = ?`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    // Si se está actualizando el DNI, validar que no exista otro con ese DNI
    if (dni && dni.trim() !== '') {
      const [duplicate] = await pool.execute(
        `SELECT id FROM pacientes WHERE dni = ? AND id != ?`,
        [dni.trim(), id]
      );
      
      if (duplicate.length > 0) {
        return res.status(409).json({ error: 'Ya existe otro paciente con ese DNI' });
      }
    }
    
    // Construir query de actualización
    const updateFields = [];
    const updateParams = [];
    
    if (dni !== undefined) {
      updateFields.push('dni = ?');
      updateParams.push(dni.trim());
    }
    
    if (nombre_completo !== undefined) {
      updateFields.push('nombre_completo = ?');
      updateParams.push(nombre_completo.trim());
    }
    
    if (telefono !== undefined) {
      updateFields.push('telefono = ?');
      updateParams.push(telefono?.trim() || null);
    }
    
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateParams.push(email?.trim() || null);
    }
    
    if (fecha_nacimiento !== undefined) {
      updateFields.push('fecha_nacimiento = ?');
      updateParams.push(fecha_nacimiento || null);
    }
    
    if (direccion !== undefined) {
      updateFields.push('direccion = ?');
      updateParams.push(direccion?.trim() || null);
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
      `UPDATE pacientes SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    // Obtener el paciente actualizado
    const [rows] = await pool.execute(
      `SELECT 
        p.id,
        p.dni,
        p.nombre_completo as name,
        p.telefono as phone,
        p.email,
        p.estado as status,
        MAX(c.fecha) as lastVisit,
        COUNT(c.id) as appointments
      FROM pacientes p
      LEFT JOIN citas c ON p.id = c.paciente_id
      WHERE p.id = ?
      GROUP BY p.id`,
      [id]
    );
    
    const paciente = {
      id: rows[0].id,
      name: rows[0].name,
      dni: rows[0].dni,
      phone: rows[0].phone,
      email: rows[0].email,
      lastVisit: rows[0].lastVisit ? new Date(rows[0].lastVisit).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : '-',
      appointments: rows[0].appointments || 0,
      status: rows[0].status,
    };
    
    res.json(paciente);
  } catch (error) {
    console.error('Error updating paciente:', error);
    
    // Manejar errores de duplicado
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('dni')) {
      return res.status(409).json({ error: 'Ya existe otro paciente con ese DNI' });
    }
    
    res.status(500).json({ error: 'Error al actualizar el paciente' });
  }
};

// DELETE /api/pacientes/:id
export const deletePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el paciente existe
    const [existing] = await pool.execute(
      `SELECT id, nombre_completo FROM pacientes WHERE id = ?`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    // Validar que no tenga citas activas
    const [citas] = await pool.execute(
      `SELECT COUNT(*) as count FROM citas 
       WHERE paciente_id = ? 
       AND estado IN ('pendiente', 'confirmada')`,
      [id]
    );
    
    if (citas[0].count > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar el paciente porque tiene ${citas[0].count} cita(s) activa(s)` 
      });
    }
    
    // Eliminar el paciente
    await pool.execute(
      `DELETE FROM pacientes WHERE id = ?`,
      [id]
    );
    
    res.json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting paciente:', error);
    res.status(500).json({ error: 'Error al eliminar el paciente' });
  }
};

