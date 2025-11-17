import { pool } from '../db.js';

// GET /api/reportes/general
export const getReporteGeneral = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    // Si no se proporcionan fechas, usar el mes actual
    let fechaInicio, fechaFin;
    if (fecha_inicio && fecha_fin) {
      fechaInicio = fecha_inicio;
      fechaFin = fecha_fin;
    } else {
      const today = new Date();
      fechaInicio = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      fechaFin = today.toISOString().split('T')[0];
    }
    
    // Total de citas en el rango
    const [totalCitas] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha >= ? AND fecha <= ?`,
      [fechaInicio, fechaFin]
    );
    
    // Citas confirmadas
    const [confirmadas] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha >= ? AND fecha <= ? AND estado = 'confirmada'`,
      [fechaInicio, fechaFin]
    );
    
    // Citas completadas
    const [completadas] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha >= ? AND fecha <= ? AND estado = 'completada'`,
      [fechaInicio, fechaFin]
    );
    
    // No-shows
    const [noShows] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha >= ? AND fecha <= ? AND estado = 'no_show'`,
      [fechaInicio, fechaFin]
    );
    
    // Citas canceladas
    const [canceladas] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha >= ? AND fecha <= ? AND estado = 'cancelada'`,
      [fechaInicio, fechaFin]
    );
    
    // Pacientes únicos
    const [pacientesUnicos] = await pool.execute(
      `SELECT COUNT(DISTINCT paciente_id) as total FROM citas WHERE fecha >= ? AND fecha <= ?`,
      [fechaInicio, fechaFin]
    );
    
    // Tasa de confirmación
    const totalCitasCount = totalCitas[0].total;
    const confirmadasCount = confirmadas[0].total;
    const tasaConfirmacion = totalCitasCount > 0 
      ? ((confirmadasCount / totalCitasCount) * 100).toFixed(1)
      : '0.0';
    
    // Tasa de no-show
    const noShowsCount = noShows[0].total;
    const tasaNoShow = totalCitasCount > 0 
      ? ((noShowsCount / totalCitasCount) * 100).toFixed(1)
      : '0.0';
    
    // Ocupación promedio (citas confirmadas / total de slots disponibles)
    // Para simplificar, calculamos como porcentaje de confirmadas sobre total
    const ocupacionPromedio = totalCitasCount > 0 
      ? ((confirmadasCount / totalCitasCount) * 100).toFixed(1)
      : '0.0';
    
    // Tiempo promedio de respuesta (últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [tiempoRespuesta] = await pool.execute(
      `SELECT AVG(TIMESTAMPDIFF(HOUR, fecha_envio, fecha_respuesta)) as promedio
       FROM confirmaciones 
       WHERE fecha_envio >= ? AND fecha_respuesta IS NOT NULL`,
      [thirtyDaysAgo]
    );
    const tiempoPromedioRespuesta = tiempoRespuesta[0].promedio 
      ? parseFloat(tiempoRespuesta[0].promedio).toFixed(1)
      : '0.0';
    
    // Eficiencia de canal SMS (últimos 30 días)
    const [smsEnviados] = await pool.execute(
      `SELECT COUNT(*) as total FROM confirmaciones WHERE fecha_envio >= ? AND canal = 'SMS'`,
      [thirtyDaysAgo]
    );
    const [smsEntregados] = await pool.execute(
      `SELECT COUNT(*) as total FROM confirmaciones WHERE fecha_envio >= ? AND canal = 'SMS' AND estado_envio = 'entregado'`,
      [thirtyDaysAgo]
    );
    const eficienciaSMS = smsEnviados[0].total > 0
      ? ((smsEntregados[0].total / smsEnviados[0].total) * 100).toFixed(1)
      : '0.0';
    
    // Reasignaciones desde lista de espera
    const [reasignaciones] = await pool.execute(
      `SELECT COUNT(*) as total FROM lista_espera 
       WHERE fecha_asignacion >= ? AND fecha_asignacion <= ? AND fecha_asignacion IS NOT NULL`,
      [fechaInicio, fechaFin]
    );
    
    // Comparación con mes anterior (para tendencias)
    const fechaInicioAnterior = new Date(new Date(fechaInicio).setMonth(new Date(fechaInicio).getMonth() - 1)).toISOString().split('T')[0];
    const fechaFinAnterior = new Date(new Date(fechaFin).setMonth(new Date(fechaFin).getMonth() - 1)).toISOString().split('T')[0];
    
    const [totalCitasAnterior] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas WHERE fecha >= ? AND fecha <= ?`,
      [fechaInicioAnterior, fechaFinAnterior]
    );
    
    const variacionTotal = totalCitasAnterior[0].total > 0
      ? (((totalCitasCount - totalCitasAnterior[0].total) / totalCitasAnterior[0].total) * 100).toFixed(1)
      : '0.0';
    
    res.json({
      fechaInicio,
      fechaFin,
      totalCitas: totalCitasCount,
      confirmadas: confirmadasCount,
      completadas: completadas[0].total,
      noShows: noShowsCount,
      canceladas: canceladas[0].total,
      pacientesUnicos: pacientesUnicos[0].total,
      tasaConfirmacion: `${tasaConfirmacion}%`,
      tasaNoShow: `${tasaNoShow}%`,
      ocupacionPromedio: `${ocupacionPromedio}%`,
      tiempoPromedioRespuesta: `${tiempoPromedioRespuesta} horas`,
      eficienciaSMS: `${eficienciaSMS}%`,
      reasignaciones: reasignaciones[0].total,
      variacionTotal: `${variacionTotal}%`,
    });
  } catch (error) {
    console.error('Error getting reporte general:', error);
    res.status(500).json({ error: 'Error al obtener reporte general' });
  }
};

// GET /api/reportes/especialidades
export const getReportePorEspecialidad = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    // Si no se proporcionan fechas, usar el mes actual
    let fechaInicio, fechaFin;
    if (fecha_inicio && fecha_fin) {
      fechaInicio = fecha_inicio;
      fechaFin = fecha_fin;
    } else {
      const today = new Date();
      fechaInicio = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      fechaFin = today.toISOString().split('T')[0];
    }
    
    const [rows] = await pool.execute(
      `SELECT 
        e.id,
        e.nombre as especialidad,
        COUNT(c.id) as totalCitas,
        SUM(CASE WHEN c.estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN c.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN c.estado = 'no_show' THEN 1 ELSE 0 END) as noShows,
        SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        COUNT(DISTINCT c.paciente_id) as pacientesUnicos
      FROM especialidades e
      LEFT JOIN profesionales p ON e.id = p.especialidad_id
      LEFT JOIN citas c ON p.id = c.profesional_id AND c.fecha >= ? AND c.fecha <= ?
      WHERE e.activo = TRUE
      GROUP BY e.id, e.nombre
      HAVING totalCitas > 0
      ORDER BY totalCitas DESC`,
      [fechaInicio, fechaFin]
    );
    
    const data = rows.map(row => {
      const total = parseInt(row.totalCitas) || 0;
      const confirmadas = parseInt(row.confirmadas) || 0;
      const tasaConfirmacion = total > 0 ? ((confirmadas / total) * 100).toFixed(1) : '0.0';
      const noShows = parseInt(row.noShows) || 0;
      const tasaNoShow = total > 0 ? ((noShows / total) * 100).toFixed(1) : '0.0';
      
      return {
        id: row.id,
        especialidad: row.especialidad,
        totalCitas: total,
        confirmadas: confirmadas,
        pendientes: parseInt(row.pendientes) || 0,
        completadas: parseInt(row.completadas) || 0,
        noShows: noShows,
        canceladas: parseInt(row.canceladas) || 0,
        pacientesUnicos: parseInt(row.pacientesUnicos) || 0,
        tasaConfirmacion: `${tasaConfirmacion}%`,
        tasaNoShow: `${tasaNoShow}%`,
      };
    });
    
    res.json({
      fechaInicio,
      fechaFin,
      data,
    });
  } catch (error) {
    console.error('Error getting reporte por especialidad:', error);
    res.status(500).json({ error: 'Error al obtener reporte por especialidad' });
  }
};

// GET /api/reportes/profesionales
export const getReportePorProfesional = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    // Si no se proporcionan fechas, usar el mes actual
    let fechaInicio, fechaFin;
    if (fecha_inicio && fecha_fin) {
      fechaInicio = fecha_inicio;
      fechaFin = fecha_fin;
    } else {
      const today = new Date();
      fechaInicio = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      fechaFin = today.toISOString().split('T')[0];
    }
    
    const [rows] = await pool.execute(
      `SELECT 
        p.id,
        p.nombre_completo as profesional,
        e.nombre as especialidad,
        COUNT(c.id) as totalCitas,
        SUM(CASE WHEN c.estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN c.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN c.estado = 'no_show' THEN 1 ELSE 0 END) as noShows,
        SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        COUNT(DISTINCT c.paciente_id) as pacientesUnicos
      FROM profesionales p
      INNER JOIN especialidades e ON p.especialidad_id = e.id
      LEFT JOIN citas c ON p.id = c.profesional_id AND c.fecha >= ? AND c.fecha <= ?
      WHERE p.estado = 'disponible'
      GROUP BY p.id, p.nombre_completo, e.nombre
      HAVING totalCitas > 0
      ORDER BY totalCitas DESC`,
      [fechaInicio, fechaFin]
    );
    
    const data = rows.map(row => {
      const total = parseInt(row.totalCitas) || 0;
      const confirmadas = parseInt(row.confirmadas) || 0;
      const tasaConfirmacion = total > 0 ? ((confirmadas / total) * 100).toFixed(1) : '0.0';
      const noShows = parseInt(row.noShows) || 0;
      const tasaNoShow = total > 0 ? ((noShows / total) * 100).toFixed(1) : '0.0';
      
      return {
        id: row.id,
        profesional: row.profesional,
        especialidad: row.especialidad,
        totalCitas: total,
        confirmadas: confirmadas,
        pendientes: parseInt(row.pendientes) || 0,
        completadas: parseInt(row.completadas) || 0,
        noShows: noShows,
        canceladas: parseInt(row.canceladas) || 0,
        pacientesUnicos: parseInt(row.pacientesUnicos) || 0,
        tasaConfirmacion: `${tasaConfirmacion}%`,
        tasaNoShow: `${tasaNoShow}%`,
      };
    });
    
    res.json({
      fechaInicio,
      fechaFin,
      data,
    });
  } catch (error) {
    console.error('Error getting reporte por profesional:', error);
    res.status(500).json({ error: 'Error al obtener reporte por profesional' });
  }
};

// GET /api/reportes/pacientes
export const getReportePorPaciente = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    // Si no se proporcionan fechas, usar el mes actual
    let fechaInicio, fechaFin;
    if (fecha_inicio && fecha_fin) {
      fechaInicio = fecha_inicio;
      fechaFin = fecha_fin;
    } else {
      const today = new Date();
      fechaInicio = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      fechaFin = today.toISOString().split('T')[0];
    }
    
    const [rows] = await pool.execute(
      `SELECT 
        pa.id,
        pa.dni,
        pa.nombre_completo as paciente,
        pa.telefono,
        pa.email,
        COUNT(c.id) as totalCitas,
        SUM(CASE WHEN c.estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN c.estado = 'no_show' THEN 1 ELSE 0 END) as noShows,
        SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas
      FROM pacientes pa
      LEFT JOIN citas c ON pa.id = c.paciente_id AND c.fecha >= ? AND c.fecha <= ?
      GROUP BY pa.id, pa.dni, pa.nombre_completo, pa.telefono, pa.email
      HAVING totalCitas > 0
      ORDER BY totalCitas DESC
      LIMIT 100`,
      [fechaInicio, fechaFin]
    );
    
    const data = rows.map(row => {
      const total = parseInt(row.totalCitas) || 0;
      const confirmadas = parseInt(row.confirmadas) || 0;
      const tasaConfirmacion = total > 0 ? ((confirmadas / total) * 100).toFixed(1) : '0.0';
      const noShows = parseInt(row.noShows) || 0;
      const tasaNoShow = total > 0 ? ((noShows / total) * 100).toFixed(1) : '0.0';
      
      return {
        id: row.id,
        dni: row.dni,
        paciente: row.paciente,
        telefono: row.telefono,
        email: row.email,
        totalCitas: total,
        confirmadas: confirmadas,
        completadas: parseInt(row.completadas) || 0,
        noShows: noShows,
        canceladas: parseInt(row.canceladas) || 0,
        tasaConfirmacion: `${tasaConfirmacion}%`,
        tasaNoShow: `${tasaNoShow}%`,
      };
    });
    
    res.json({
      fechaInicio,
      fechaFin,
      data,
    });
  } catch (error) {
    console.error('Error getting reporte por paciente:', error);
    res.status(500).json({ error: 'Error al obtener reporte por paciente' });
  }
};

