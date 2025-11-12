import { pool } from '../db.js';

// GET /api/profesionales
export const getProfesionales = async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
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

