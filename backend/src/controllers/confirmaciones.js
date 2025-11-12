import { pool } from '../db.js';

// GET /api/confirmaciones
export const getConfirmaciones = async (req, res) => {
  try {
    const { status, channel } = req.query;
    
    let query = `
      SELECT 
        conf.id,
        pa.nombre_completo as patient,
        DATE(c.fecha) as date,
        TIME(c.hora) as time,
        conf.estado_envio as status,
        conf.respuesta as response,
        conf.canal as channel,
        conf.fecha_envio as sent
      FROM confirmaciones conf
      INNER JOIN citas c ON conf.cita_id = c.id
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status && status !== 'all') {
      query += ` AND conf.estado_envio = ?`;
      params.push(status);
    }
    
    if (channel && channel !== 'all-channels') {
      query += ` AND conf.canal = ?`;
      params.push(channel.toUpperCase());
    }
    
    query += ` ORDER BY conf.fecha_envio DESC LIMIT 100`;
    
    const [rows] = await pool.execute(query, params);
    
    const confirmaciones = rows.map(conf => ({
      id: conf.id,
      patient: conf.patient,
      date: new Date(conf.date).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      time: conf.time.substring(0, 5),
      status: conf.status,
      response: conf.response === 'pendiente' ? '-' : conf.response,
      channel: conf.channel,
      sent: new Date(conf.sent).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    }));

    // Obtener estadísticas
    const today = new Date().toISOString().split('T')[0];
    const [enviadosHoy] = await pool.execute(
      `SELECT COUNT(*) as total FROM confirmaciones WHERE DATE(fecha_envio) = ?`,
      [today]
    );
    const [confirmadas] = await pool.execute(
      `SELECT COUNT(*) as total FROM confirmaciones WHERE respuesta = 'confirmada' AND DATE(fecha_envio) = ?`,
      [today]
    );
    const [pendientes] = await pool.execute(
      `SELECT COUNT(*) as total FROM confirmaciones WHERE estado_envio = 'pendiente' AND DATE(fecha_envio) = ?`,
      [today]
    );
    const [fallidos] = await pool.execute(
      `SELECT COUNT(*) as total FROM confirmaciones WHERE estado_envio = 'fallido' AND DATE(fecha_envio) = ?`,
      [today]
    );

    res.json({
      confirmaciones,
      stats: {
        enviadosHoy: enviadosHoy[0].total,
        confirmadas: confirmadas[0].total,
        pendientes: pendientes[0].total,
        fallidos: fallidos[0].total,
      },
    });
  } catch (error) {
    console.error('Error getting confirmaciones:', error);
    res.status(500).json({ error: 'Error al obtener confirmaciones' });
  }
};

