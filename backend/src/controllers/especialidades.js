import { pool } from '../db.js';

// GET /api/especialidades
export const getEspecialidades = async (req, res) => {
  try {
    const { search, activo } = req.query;
    
    let query = `
      SELECT 
        e.id,
        e.nombre,
        e.descripcion,
        e.activo,
        e.fecha_creacion,
        COUNT(DISTINCT p.id) as profesionales_count
      FROM especialidades e
      LEFT JOIN profesionales p ON e.id = p.especialidad_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (e.nombre LIKE ? OR e.descripcion LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (activo !== undefined) {
      query += ` AND e.activo = ?`;
      params.push(activo === 'true' ? 1 : 0);
    }
    
    query += ` GROUP BY e.id ORDER BY e.nombre ASC`;
    
    const [rows] = await pool.execute(query, params);
    
    const especialidades = rows.map(esp => ({
      id: esp.id,
      nombre: esp.nombre,
      descripcion: esp.descripcion || '',
      activo: esp.activo === 1,
      fecha_creacion: esp.fecha_creacion,
      profesionales_count: esp.profesionales_count || 0,
    }));

    res.json({ especialidades });
  } catch (error) {
    console.error('Error getting especialidades:', error);
    res.status(500).json({ error: 'Error al obtener especialidades' });
  }
};

// POST /api/especialidades
export const createEspecialidad = async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body;
    
    // Validaciones básicas
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    // Validar que el nombre no exista
    const [existing] = await pool.execute(
      `SELECT id FROM especialidades WHERE nombre = ?`,
      [nombre.trim()]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe una especialidad con ese nombre' });
    }
    
    // Crear la especialidad
    const [result] = await pool.execute(
      `INSERT INTO especialidades (nombre, descripcion, activo) VALUES (?, ?, ?)`,
      [nombre.trim(), descripcion?.trim() || null, activo !== undefined ? (activo ? 1 : 0) : 1]
    );
    
    // Obtener la especialidad creada
    const [rows] = await pool.execute(
      `SELECT id, nombre, descripcion, activo, fecha_creacion FROM especialidades WHERE id = ?`,
      [result.insertId]
    );
    
    const especialidad = {
      id: rows[0].id,
      nombre: rows[0].nombre,
      descripcion: rows[0].descripcion || '',
      activo: rows[0].activo === 1,
      fecha_creacion: rows[0].fecha_creacion,
      profesionales_count: 0,
    };
    
    res.status(201).json(especialidad);
  } catch (error) {
    console.error('Error creating especialidad:', error);
    
    // Manejar errores de duplicado
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('nombre')) {
      return res.status(409).json({ error: 'Ya existe una especialidad con ese nombre' });
    }
    
    res.status(500).json({ error: 'Error al crear la especialidad' });
  }
};

// PUT /api/especialidades/:id
export const updateEspecialidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;
    
    // Validar que la especialidad existe
    const [existing] = await pool.execute(
      `SELECT id FROM especialidades WHERE id = ?`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Especialidad no encontrada' });
    }
    
    // Si se está actualizando el nombre, validar que no exista otro con ese nombre
    if (nombre && nombre.trim() !== '') {
      const [duplicate] = await pool.execute(
        `SELECT id FROM especialidades WHERE nombre = ? AND id != ?`,
        [nombre.trim(), id]
      );
      
      if (duplicate.length > 0) {
        return res.status(409).json({ error: 'Ya existe otra especialidad con ese nombre' });
      }
    }
    
    // Construir query de actualización
    const updateFields = [];
    const updateParams = [];
    
    if (nombre !== undefined) {
      updateFields.push('nombre = ?');
      updateParams.push(nombre.trim());
    }
    
    if (descripcion !== undefined) {
      updateFields.push('descripcion = ?');
      updateParams.push(descripcion?.trim() || null);
    }
    
    if (activo !== undefined) {
      updateFields.push('activo = ?');
      updateParams.push(activo ? 1 : 0);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }
    
    updateParams.push(id);
    
    await pool.execute(
      `UPDATE especialidades SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    // Obtener la especialidad actualizada
    const [rows] = await pool.execute(
      `SELECT 
        e.id,
        e.nombre,
        e.descripcion,
        e.activo,
        e.fecha_creacion,
        COUNT(DISTINCT p.id) as profesionales_count
      FROM especialidades e
      LEFT JOIN profesionales p ON e.id = p.especialidad_id
      WHERE e.id = ?
      GROUP BY e.id`,
      [id]
    );
    
    const especialidad = {
      id: rows[0].id,
      nombre: rows[0].nombre,
      descripcion: rows[0].descripcion || '',
      activo: rows[0].activo === 1,
      fecha_creacion: rows[0].fecha_creacion,
      profesionales_count: rows[0].profesionales_count || 0,
    };
    
    res.json(especialidad);
  } catch (error) {
    console.error('Error updating especialidad:', error);
    
    // Manejar errores de duplicado
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('nombre')) {
      return res.status(409).json({ error: 'Ya existe otra especialidad con ese nombre' });
    }
    
    res.status(500).json({ error: 'Error al actualizar la especialidad' });
  }
};

// DELETE /api/especialidades/:id
export const deleteEspecialidad = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que la especialidad existe
    const [existing] = await pool.execute(
      `SELECT id, nombre FROM especialidades WHERE id = ?`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Especialidad no encontrada' });
    }
    
    // Validar que no esté en uso por profesionales
    const [profesionales] = await pool.execute(
      `SELECT COUNT(*) as count FROM profesionales WHERE especialidad_id = ?`,
      [id]
    );
    
    if (profesionales[0].count > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la especialidad porque está siendo utilizada por ${profesionales[0].count} profesional(es)` 
      });
    }
    
    // Validar que no esté en uso por lista de espera
    const [listaEspera] = await pool.execute(
      `SELECT COUNT(*) as count FROM lista_espera WHERE especialidad_id = ? AND fecha_asignacion IS NULL`,
      [id]
    );
    
    if (listaEspera[0].count > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la especialidad porque está siendo utilizada en la lista de espera` 
      });
    }
    
    // Eliminar la especialidad
    await pool.execute(
      `DELETE FROM especialidades WHERE id = ?`,
      [id]
    );
    
    res.json({ message: 'Especialidad eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting especialidad:', error);
    res.status(500).json({ error: 'Error al eliminar la especialidad' });
  }
};

