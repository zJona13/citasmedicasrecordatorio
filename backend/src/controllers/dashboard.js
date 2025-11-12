import { pool } from '../db.js';

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Citas totales hoy
    const [citasHoy] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha = ?`,
      [today]
    );

    // Citas confirmadas hoy
    const [confirmadas] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha = ? AND estado = 'confirmada'`,
      [today]
    );

    // Citas pendientes hoy
    const [pendientes] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha = ? AND estado = 'pendiente'`,
      [today]
    );

    // No-shows hoy
    const [noShows] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha = ? AND estado = 'no_show'`,
      [today]
    );

    // Consultorios activos (profesionales disponibles)
    const [consultorios] = await pool.execute(
      `SELECT COUNT(DISTINCT consultorio) as total FROM profesionales WHERE estado = 'disponible' AND consultorio IS NOT NULL`
    );

    // Pacientes atendidos este mes
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const [pacientesMes] = await pool.execute(
      `SELECT COUNT(DISTINCT paciente_id) as total FROM citas WHERE fecha >= ? AND estado = 'completada'`,
      [firstDayOfMonth]
    );

    // Tasa de confirmación (últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [totalCitas30] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha >= ?`,
      [thirtyDaysAgo]
    );
    const [confirmadas30] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha >= ? AND estado = 'confirmada'`,
      [thirtyDaysAgo]
    );
    const tasaConfirmacion = totalCitas30[0].total > 0 
      ? ((confirmadas30[0].total / totalCitas30[0].total) * 100).toFixed(1)
      : '0.0';

    // En lista de espera
    const [listaEspera] = await pool.execute(
      `SELECT COUNT(*) as total FROM lista_espera WHERE oferta_activa = FALSE`
    );
    const [ofertasActivas] = await pool.execute(
      `SELECT COUNT(*) as total FROM lista_espera WHERE oferta_activa = TRUE`
    );

    res.json({
      citasTotalesHoy: citasHoy[0].total,
      confirmadas: confirmadas[0].total,
      pendientes: pendientes[0].total,
      noShows: noShows[0].total,
      consultoriosActivos: consultorios[0].total,
      pacientesMes: pacientesMes[0].total,
      tasaConfirmacion: `${tasaConfirmacion}%`,
      enListaEspera: listaEspera[0].total,
      ofertasActivas: ofertasActivas[0].total,
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' });
  }
};

// GET /api/dashboard/charts/trend
export const getTrendChart = async (req, res) => {
  try {
    // Obtener datos de la última semana
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const [rows] = await pool.execute(
      `SELECT 
        DATE(fecha) as dia,
        SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) as confirmaciones,
        SUM(CASE WHEN estado = 'no_show' THEN 1 ELSE 0 END) as noShows
      FROM citas
      WHERE fecha >= ? AND fecha <= ?
      GROUP BY DATE(fecha)
      ORDER BY fecha ASC`,
      [sevenDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]]
    );

    // Formatear datos para el gráfico
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const data = rows.map(row => ({
      dia: diasSemana[new Date(row.dia).getDay()],
      confirmaciones: parseInt(row.confirmaciones) || 0,
      noShows: parseInt(row.noShows) || 0,
    }));

    res.json(data);
  } catch (error) {
    console.error('Error getting trend chart:', error);
    res.status(500).json({ error: 'Error al obtener datos del gráfico de tendencias' });
  }
};

// GET /api/dashboard/charts/occupation
export const getOccupationChart = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        e.nombre as especialidad,
        SUM(CASE WHEN c.estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN c.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as liberadas,
        SUM(CASE WHEN c.estado = 'no_show' THEN 1 ELSE 0 END) as reasignadas
      FROM especialidades e
      LEFT JOIN profesionales p ON e.id = p.especialidad_id
      LEFT JOIN citas c ON p.id = c.profesional_id
      WHERE e.activo = TRUE
      GROUP BY e.id, e.nombre
      ORDER BY e.nombre ASC`
    );

    const data = rows.map(row => ({
      especialidad: row.especialidad,
      confirmadas: parseInt(row.confirmadas) || 0,
      pendientes: parseInt(row.pendientes) || 0,
      liberadas: parseInt(row.liberadas) || 0,
      reasignadas: parseInt(row.reasignadas) || 0,
    }));

    res.json(data);
  } catch (error) {
    console.error('Error getting occupation chart:', error);
    res.status(500).json({ error: 'Error al obtener datos del gráfico de ocupación' });
  }
};

