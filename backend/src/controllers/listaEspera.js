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
        pr.nombre_completo as professional,
        le.prioridad as priority,
        DATEDIFF(NOW(), le.fecha_registro) as waitDays,
        le.oferta_activa as offerActive,
        le.fecha_expiracion_oferta as offerExpiry,
        le.canal_preferido as channel,
        le.fecha_asignacion as fechaAsignacion
      FROM lista_espera le
      INNER JOIN pacientes pa ON le.paciente_id = pa.id
      INNER JOIN especialidades e ON le.especialidad_id = e.id
      LEFT JOIN profesionales pr ON le.profesional_id = pr.id
      WHERE le.fecha_asignacion IS NULL
      ORDER BY le.prioridad ASC, le.fecha_registro ASC`
    );
    
    const listaEspera = rows.map(item => ({
      id: item.id.toString(),
      patient: item.patient,
      phone: item.phone,
      specialty: item.specialty,
      professional: item.professional || 'Cualquier profesional',
      priority: item.priority,
      waitTime: `${item.waitDays} días`,
      offerActive: item.offerActive === 1,
      offerExpiry: item.offerExpiry ? new Date(item.offerExpiry).toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit'
      }) : undefined,
      channel: item.channel || 'SMS',
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

// POST /api/lista-espera
export const createListaEspera = async (req, res) => {
  try {
    const { dni, nombre_completo, telefono, especialidad_id, profesional_id, canal_preferido } = req.body;
    
    if (!dni || !nombre_completo || !especialidad_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos: dni, nombre_completo, especialidad_id' });
    }

    // Buscar o crear paciente
    let [pacienteRows] = await pool.execute(
      `SELECT id FROM pacientes WHERE dni = ?`,
      [dni]
    );
    
    let pacienteId;
    if (pacienteRows.length > 0) {
      pacienteId = pacienteRows[0].id;
      // Actualizar datos
      if (nombre_completo || telefono) {
        const updateFields = [];
        const updateParams = [];
        
        if (nombre_completo) {
          updateFields.push('nombre_completo = ?');
          updateParams.push(nombre_completo);
        }
        if (telefono) {
          updateFields.push('telefono = ?');
          updateParams.push(telefono);
        }
        
        if (updateFields.length > 0) {
          updateParams.push(pacienteId);
          await pool.execute(
            `UPDATE pacientes SET ${updateFields.join(', ')} WHERE id = ?`,
            updateParams
          );
        }
      }
    } else {
      const [result] = await pool.execute(
        `INSERT INTO pacientes (dni, nombre_completo, telefono, estado) VALUES (?, ?, ?, 'activo')`,
        [dni, nombre_completo, telefono || null]
      );
      pacienteId = result.insertId;
    }
    
    // Crear entrada en lista de espera
    const [result] = await pool.execute(
      `INSERT INTO lista_espera (paciente_id, especialidad_id, profesional_id, canal_preferido) 
       VALUES (?, ?, ?, ?)`,
      [
        pacienteId,
        especialidad_id,
        profesional_id || null,
        canal_preferido || 'SMS'
      ]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: 'Paciente agregado a la lista de espera exitosamente'
    });
  } catch (error) {
    console.error('Error creando lista de espera:', error);
    res.status(500).json({ error: 'Error al agregar a la lista de espera' });
  }
};

