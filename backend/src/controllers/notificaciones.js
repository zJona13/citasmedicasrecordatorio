import { pool } from '../db.js';

// GET /api/notificaciones
export const getNotificaciones = async (req, res) => {
  try {
    const notificaciones = [];

    // 1. Confirmaciones pendientes (últimas 24h)
    const [confirmacionesPendientes] = await pool.execute(
      `SELECT 
        conf.id,
        conf.cita_id,
        pa.nombre_completo as patient,
        DATE(c.fecha) as fecha,
        TIME(c.hora) as hora,
        conf.canal,
        conf.fecha_envio
      FROM confirmaciones conf
      INNER JOIN citas c ON conf.cita_id = c.id
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      WHERE conf.estado_envio = 'pendiente'
      AND conf.fecha_envio >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY conf.fecha_envio DESC`
    );

    confirmacionesPendientes.forEach(conf => {
      notificaciones.push({
        id: `conf_pendiente_${conf.id}`,
        tipo: 'confirmacion_pendiente',
        titulo: 'Confirmación pendiente',
        mensaje: `Confirmación pendiente para ${conf.patient} - ${conf.fecha} ${conf.hora.substring(0, 5)} (${conf.canal})`,
        fecha: conf.fecha_envio,
        leida: false,
        accion: {
          tipo: 'navegar',
          ruta: '/confirmaciones',
          params: { citaId: conf.cita_id }
        }
      });
    });

    // 2. Confirmaciones fallidas (últimas 24h)
    const [confirmacionesFallidas] = await pool.execute(
      `SELECT 
        conf.id,
        conf.cita_id,
        pa.nombre_completo as patient,
        DATE(c.fecha) as fecha,
        TIME(c.hora) as hora,
        conf.canal,
        conf.fecha_envio
      FROM confirmaciones conf
      INNER JOIN citas c ON conf.cita_id = c.id
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      WHERE conf.estado_envio = 'fallido'
      AND conf.fecha_envio >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY conf.fecha_envio DESC`
    );

    confirmacionesFallidas.forEach(conf => {
      notificaciones.push({
        id: `conf_fallida_${conf.id}`,
        tipo: 'confirmacion_fallida',
        titulo: 'Confirmación fallida',
        mensaje: `No se pudo enviar confirmación a ${conf.patient} - ${conf.fecha} ${conf.hora.substring(0, 5)} (${conf.canal})`,
        fecha: conf.fecha_envio,
        leida: false,
        accion: {
          tipo: 'navegar',
          ruta: '/confirmaciones',
          params: { citaId: conf.cita_id }
        }
      });
    });

    // 3. Ofertas de lista de espera expirando en menos de 15 minutos
    const [ofertasExpirando] = await pool.execute(
      `SELECT 
        le.id,
        pa.nombre_completo as patient,
        e.nombre as especialidad,
        le.fecha_expiracion_oferta,
        le.fecha_oferta,
        le.hora_oferta
      FROM lista_espera le
      INNER JOIN pacientes pa ON le.paciente_id = pa.id
      INNER JOIN especialidades e ON le.especialidad_id = e.id
      WHERE le.oferta_activa = TRUE
      AND le.fecha_expiracion_oferta <= DATE_ADD(NOW(), INTERVAL 15 MINUTE)
      AND le.fecha_expiracion_oferta > NOW()
      ORDER BY le.fecha_expiracion_oferta ASC`
    );

    ofertasExpirando.forEach(oferta => {
      const minutosRestantes = Math.ceil(
        (new Date(oferta.fecha_expiracion_oferta) - new Date()) / (1000 * 60)
      );
      notificaciones.push({
        id: `oferta_expirando_${oferta.id}`,
        tipo: 'oferta_expirando',
        titulo: 'Oferta expirando pronto',
        mensaje: `Oferta para ${oferta.patient} (${oferta.especialidad}) expira en ${minutosRestantes} minuto${minutosRestantes !== 1 ? 's' : ''}`,
        fecha: new Date(),
        leida: false,
        accion: {
          tipo: 'navegar',
          ruta: '/lista-espera'
        }
      });
    });

    // 4. Citas pendientes próximas (hoy o mañana) sin confirmar
    const [citasPendientes] = await pool.execute(
      `SELECT 
        c.id,
        pa.nombre_completo as patient,
        pr.nombre_completo as doctor,
        e.nombre as especialidad,
        DATE(c.fecha) as fecha,
        TIME(c.hora) as hora
      FROM citas c
      INNER JOIN pacientes pa ON c.paciente_id = pa.id
      INNER JOIN profesionales pr ON c.profesional_id = pr.id
      INNER JOIN especialidades e ON pr.especialidad_id = e.id
      WHERE c.estado = 'pendiente'
      AND c.fecha BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      AND NOT EXISTS (
        SELECT 1 FROM confirmaciones conf
        WHERE conf.cita_id = c.id
        AND conf.respuesta = 'confirmada'
      )
      ORDER BY c.fecha ASC, c.hora ASC
      LIMIT 10`
    );

    citasPendientes.forEach(cita => {
      const esHoy = cita.fecha.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
      notificaciones.push({
        id: `cita_pendiente_${cita.id}`,
        tipo: 'cita_pendiente',
        titulo: esHoy ? 'Cita pendiente hoy' : 'Cita pendiente mañana',
        mensaje: `${cita.patient} con ${cita.doctor} (${cita.especialidad}) - ${cita.fecha.toISOString().split('T')[0]} ${cita.hora.substring(0, 5)}`,
        fecha: new Date(),
        leida: false,
        accion: {
          tipo: 'navegar',
          ruta: '/citas',
          params: { citaId: cita.id }
        }
      });
    });

    // Ordenar por fecha (más recientes primero)
    notificaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json({
      notificaciones,
      total: notificaciones.length,
      noLeidas: notificaciones.filter(n => !n.leida).length
    });
  } catch (error) {
    console.error('Error getting notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

// PATCH /api/notificaciones/:id/leer
export const marcarLeida = async (req, res) => {
  try {
    // Como las notificaciones son dinámicas, simplemente retornamos éxito
    // En una implementación futura con tabla de notificaciones, aquí se marcaría como leída
    res.json({ 
      message: 'Notificación marcada como leída',
      id: req.params.id 
    });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({ error: 'Error al marcar notificación como leída' });
  }
};

// PATCH /api/notificaciones/leer-todas
export const marcarTodasLeidas = async (req, res) => {
  try {
    // Como las notificaciones son dinámicas, simplemente retornamos éxito
    // En una implementación futura con tabla de notificaciones, aquí se marcarían todas como leídas
    res.json({ 
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    res.status(500).json({ error: 'Error al marcar todas las notificaciones como leídas' });
  }
};

