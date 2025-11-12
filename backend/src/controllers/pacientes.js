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

    // Obtener estadísticas
    const [total] = await pool.execute('SELECT COUNT(*) as total FROM pacientes');
    const [activos] = await pool.execute(
      `SELECT COUNT(*) as total FROM pacientes WHERE estado = 'activo' AND fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const [nuevos] = await pool.execute(
      `SELECT COUNT(*) as total FROM pacientes WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`
    );
    const [conCitas] = await pool.execute(
      `SELECT COUNT(DISTINCT paciente_id) as total FROM citas WHERE estado IN ('pendiente', 'confirmada')`
    );

    res.json({
      pacientes,
      stats: {
        total: total[0].total,
        activos: activos[0].total,
        nuevos: nuevos[0].total,
        conCitasPendientes: conCitas[0].total,
      },
    });
  } catch (error) {
    console.error('Error getting pacientes:', error);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
};

