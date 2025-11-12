import { pool } from '../db.js';

// GET /api/lista-espera
export const getListaEspera = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        le.id,
        pa.nombre_completo as patient,
        pa.telefono as phone,
        e.nombre as specialty,
        le.prioridad as priority,
        DATEDIFF(NOW(), le.fecha_registro) as waitDays,
        le.oferta_activa as offerActive,
        le.fecha_expiracion_oferta as offerExpiry
      FROM lista_espera le
      INNER JOIN pacientes pa ON le.paciente_id = pa.id
      INNER JOIN especialidades e ON le.especialidad_id = e.id
      ORDER BY le.prioridad ASC, le.fecha_registro ASC`
    );
    
    const listaEspera = rows.map(item => ({
      id: item.id.toString(),
      patient: item.patient,
      phone: item.phone,
      specialty: item.specialty,
      priority: item.priority,
      waitTime: `${item.waitDays} días`,
      offerActive: item.offerActive === 1,
      offerExpiry: item.offerExpiry ? new Date(item.offerExpiry).toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit'
      }) : undefined,
    }));

    // Contar ofertas activas que expiran pronto
    const [ofertasExpirando] = await pool.execute(
      `SELECT COUNT(*) as total FROM lista_espera 
       WHERE oferta_activa = TRUE 
       AND fecha_expiracion_oferta <= DATE_ADD(NOW(), INTERVAL 15 MINUTE)`
    );

    res.json({
      listaEspera,
      ofertasExpirando: ofertasExpirando[0].total,
    });
  } catch (error) {
    console.error('Error getting lista espera:', error);
    res.status(500).json({ error: 'Error al obtener lista de espera' });
  }
};

